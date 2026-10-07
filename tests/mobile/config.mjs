import { execFileSync } from 'node:child_process';

const env = process.env;
export const realDevice = env.IOS_REAL_DEVICE === '1';
export const baseUrl = new URL(env.STORYBOOK_URL || 'http://127.0.0.1:6006/');

function isDeviceLocalHostname(hostname) {
  const host = hostname.replace(/\.$/, '');
  // URL canonicalizes IP literals, including dotted IPv4-mapped IPv6 addresses.
  const mappedIPv4 = /^\[::ffff:([\da-f]+):([\da-f]+)\]$/.exec(host);
  if (mappedIPv4) {
    const firstOctet = Number.parseInt(mappedIPv4[1], 16) >>> 8;
    return firstOctet === 0 || firstOctet === 127;
  }
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    /^(?:0|127)(?:\.\d{1,3}){3}$/.test(host) ||
    ['[::]', '[::1]'].includes(host)
  );
}

if (!['http:', 'https:'].includes(baseUrl.protocol)) {
  throw new Error('STORYBOOK_URL must be an http(s) URL.');
}
if (realDevice && isDeviceLocalHostname(baseUrl.hostname)) {
  throw new Error(
    'Set STORYBOOK_URL to a URL reachable from the iPhone (e.g. your Mac LAN IP).'
  );
}

let udid = env.IOS_UDID;
let deviceName = env.IOS_DEVICE_NAME || 'iPhone 17 Pro';
let platformVersion = env.IOS_PLATFORM_VERSION;
if (realDevice) {
  if (!udid || udid === 'auto') {
    throw new Error(
      'Real-device runs require an explicit IOS_UDID; automatic selection is disabled.'
    );
  }
  deviceName = env.IOS_DEVICE_NAME || 'iPhone';
} else {
  const inventory = JSON.parse(
    execFileSync(
      'xcrun',
      ['simctl', 'list', 'devices', 'available', '--json'],
      {
        encoding: 'utf8',
      }
    )
  );
  const matches = Object.entries(inventory.devices)
    .flatMap(([runtime, devices]) =>
      devices
        .filter((device) =>
          udid ? device.udid === udid : device.name === deviceName
        )
        .map((device) => ({
          ...device,
          version: runtime.split('.iOS-')[1]?.replaceAll('-', '.'),
        }))
    )
    .filter(
      (device) =>
        device.version &&
        (!platformVersion || device.version === platformVersion)
    );
  if (matches.length !== 1) {
    throw new Error(
      `Expected one available iOS simulator, found ${matches.length}. Set IOS_UDID or IOS_PLATFORM_VERSION; run xcrun simctl list devices available.`
    );
  }
  ({ udid, name: deviceName, version: platformVersion } = matches[0]);
}

const capabilities = {
  platformName: 'iOS',
  browserName: 'Safari',
  'appium:automationName': 'XCUITest',
  'appium:udid': udid,
  'appium:deviceName': deviceName,
  'appium:noReset': true,
  'appium:shouldTerminateApp': false,
  'appium:nativeWebTap': true,
  'appium:newCommandTimeout': 180,
  'appium:wdaLaunchTimeout': 120000,
  'appium:safariInitialUrl': baseUrl.href,
};
if (platformVersion) capabilities['appium:platformVersion'] = platformVersion;

// Keep machine-specific signing and existing WDA configuration out of the repo.
for (const [variable, capability] of Object.entries({
  IOS_TEAM_ID: 'xcodeOrgId',
  IOS_SIGNING_ID: 'xcodeSigningId',
  IOS_WDA_BUNDLE_ID: 'updatedWDABundleId',
  IOS_XCCONFIG: 'xcodeConfigFile',
  IOS_WDA_URL: 'webDriverAgentUrl',
  IOS_WDA_DERIVED_DATA: 'derivedDataPath',
})) {
  if (env[variable]) capabilities[`appium:${capability}`] = env[variable];
}
if (env.IOS_TEAM_ID && !env.IOS_SIGNING_ID) {
  capabilities['appium:xcodeSigningId'] = 'Apple Development';
}
for (const [variable, capability] of Object.entries({
  IOS_WDA_PORT: 'wdaLocalPort',
  IOS_WDA_REMOTE_PORT: 'wdaRemotePort',
})) {
  if (env[variable]) {
    const port = Number(env[variable]);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`${variable} must be an integer from 1 to 65535.`);
    }
    capabilities[`appium:${capability}`] = port;
  }
}
if (env.IOS_SHOW_XCODE_LOG === '1') capabilities['appium:showXcodeLog'] = true;

const server = new URL(env.APPIUM_URL || 'http://127.0.0.1:4723/');
export const options = {
  protocol: server.protocol.slice(0, -1),
  hostname: server.hostname,
  port: Number(server.port || (server.protocol === 'https:' ? 443 : 80)),
  path: server.pathname,
  logLevel: 'warn',
  connectionRetryTimeout: 240000,
  connectionRetryCount: 0,
  waitforTimeout: 60000,
  capabilities,
};

export function storyUrl(id) {
  const url = new URL(
    'iframe.html',
    baseUrl.href.endsWith('/') ? baseUrl : `${baseUrl.href}/`
  );
  url.searchParams.set('id', id);
  url.searchParams.set('viewMode', 'story');
  url.searchParams.set(
    'globals',
    'brand:mieweb;theme:light;density:standard;locale:en'
  );
  return url.href;
}
