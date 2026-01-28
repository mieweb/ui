import * as React from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../Input';
import { Switch } from '../Switch';
import { Button } from '../Button';

// ============================================================================
// Types
// ============================================================================

export interface SSOConfigData {
  /** Client domain for SSO */
  clientDomain: string;
  /** SSO login URL */
  ssoLoginUrl: string;
  /** SSO logout URL (optional) */
  ssoLogoutUrl?: string;
  /** Force re-authentication on each login */
  forceReauthentication?: boolean;
  /** IDP signs the request */
  idpSignsRequest?: boolean;
  /** Allow unencrypted assertions */
  allowUnencryptedAssertion?: boolean;
}

export interface SSOConfigFormProps {
  /** Initial configuration data */
  initialData?: Partial<SSOConfigData>;
  /** Whether an identity provider is already configured (show delete button) */
  hasExistingConfig?: boolean;
  /** Callback when form is submitted */
  onSubmit: (data: SSOConfigData, certificateFile?: File) => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Custom className */
  className?: string;
  /** Labels for internationalization */
  labels?: {
    title?: string;
    clientDomain?: string;
    clientDomainPlaceholder?: string;
    invalidClientDomain?: string;
    ssoLoginUrl?: string;
    ssoLoginUrlPlaceholder?: string;
    invalidSsoLoginUrl?: string;
    ssoLogoutUrl?: string;
    ssoLogoutUrlPlaceholder?: string;
    selectCertificate?: string;
    selectFileToUpload?: string;
    certificateSelected?: string;
    otherOptions?: string;
    forceReauthentication?: string;
    forceReauthenticationDescription?: string;
    idpSignsRequest?: string;
    idpSignsRequestDescription?: string;
    allowUnencryptedAssertion?: string;
    allowUnencryptedAssertionDescription?: string;
    save?: string;
    delete?: string;
    cancel?: string;
  };
}

// ============================================================================
// SSOConfigForm Component
// ============================================================================

/**
 * A form for configuring Single Sign-On (SSO) / SAML settings.
 *
 * @example
 * ```tsx
 * <SSOConfigForm
 *   onSubmit={(data, certFile) => saveSSO(data, certFile)}
 *   onDelete={() => deleteSSO()}
 *   hasExistingConfig={!!identityProvider}
 * />
 * ```
 */
export function SSOConfigForm({
  initialData = {},
  hasExistingConfig = false,
  onSubmit,
  onDelete,
  onCancel,
  className,
  labels = {},
}: SSOConfigFormProps) {
  const {
    title = 'Configure Single Sign-On',
    clientDomain: clientDomainLabel = 'Client Domain',
    clientDomainPlaceholder = 'example.com',
    invalidClientDomain = 'Please enter a valid client domain',
    ssoLoginUrl: ssoLoginUrlLabel = 'SSO Login URL',
    ssoLoginUrlPlaceholder = 'https://idp.example.com/login',
    invalidSsoLoginUrl = 'Please enter a valid SSO login URL',
    ssoLogoutUrl: ssoLogoutUrlLabel = 'SSO Logout URL',
    ssoLogoutUrlPlaceholder = 'https://idp.example.com/logout',
    selectCertificate = 'Select certificate file to upload (.cert)',
    selectFileToUpload = 'Select File to Upload',
    certificateSelected = 'Certificate selected:',
    otherOptions = 'Other SSO Options',
    forceReauthentication = 'Force Re-authentication',
    forceReauthenticationDescription = 'Require users to authenticate every time',
    idpSignsRequest = 'IDP Signs Request',
    idpSignsRequestDescription = 'Enable if your IDP signs the authentication request',
    allowUnencryptedAssertion = 'Allow Unencrypted Assertion',
    allowUnencryptedAssertionDescription = 'Allow assertions without encryption (less secure)',
    save = 'Save SSO Settings',
    delete: deleteLabel = 'Delete SSO',
    cancel = 'Cancel',
  } = labels;

  // Form state
  const [clientDomain, setClientDomain] = React.useState(
    initialData.clientDomain ?? ''
  );
  const [ssoLoginUrl, setSsoLoginUrl] = React.useState(
    initialData.ssoLoginUrl ?? ''
  );
  const [ssoLogoutUrl, setSsoLogoutUrl] = React.useState(
    initialData.ssoLogoutUrl ?? ''
  );
  const [forceReauth, setForceReauth] = React.useState(
    initialData.forceReauthentication ?? false
  );
  const [idpSigns, setIdpSigns] = React.useState(
    initialData.idpSignsRequest ?? false
  );
  const [allowUnencrypted, setAllowUnencrypted] = React.useState(
    initialData.allowUnencryptedAssertion ?? false
  );
  const [certificateFile, setCertificateFile] = React.useState<File | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientDomain.trim()) {
      newErrors.clientDomain = invalidClientDomain;
    }

    if (!ssoLoginUrl.trim()) {
      newErrors.ssoLoginUrl = invalidSsoLoginUrl;
    } else {
      try {
        new URL(ssoLoginUrl);
      } catch {
        newErrors.ssoLoginUrl = invalidSsoLoginUrl;
      }
    }

    // Certificate is required for new configurations
    if (!hasExistingConfig && !certificateFile) {
      newErrors.certificate = selectCertificate;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit(
      {
        clientDomain,
        ssoLoginUrl,
        ssoLogoutUrl: ssoLogoutUrl || undefined,
        forceReauthentication: forceReauth,
        idpSignsRequest: idpSigns,
        allowUnencryptedAssertion: allowUnencrypted,
      },
      certificateFile ?? undefined
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertificateFile(file);
      setErrors((prev) => ({ ...prev, certificate: '' }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.cert')) {
      setCertificateFile(file);
      setErrors((prev) => ({ ...prev, certificate: '' }));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <h3 className="text-xl font-semibold">{title}</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Domain */}
        <Input
          label={clientDomainLabel}
          value={clientDomain}
          onChange={(e) => setClientDomain(e.target.value)}
          placeholder={clientDomainPlaceholder}
          error={errors.clientDomain}
          required
        />

        {/* SSO Login URL */}
        <Input
          label={ssoLoginUrlLabel}
          type="url"
          value={ssoLoginUrl}
          onChange={(e) => setSsoLoginUrl(e.target.value)}
          placeholder={ssoLoginUrlPlaceholder}
          error={errors.ssoLoginUrl}
          required
        />

        {/* SSO Logout URL */}
        <Input
          label={ssoLogoutUrlLabel}
          type="url"
          value={ssoLogoutUrl}
          onChange={(e) => setSsoLogoutUrl(e.target.value)}
          placeholder={ssoLogoutUrlPlaceholder}
        />

        {/* Certificate Upload */}
        <div className="space-y-2">
          <label
            htmlFor="cert-upload"
            className={cn(
              'flex flex-col items-center justify-center',
              'w-full cursor-pointer rounded-lg border-2 border-dashed p-6',
              'transition-colors duration-200',
              'hover:border-primary hover:bg-primary/5',
              errors.certificate
                ? 'border-destructive bg-destructive/5'
                : 'border-border bg-muted/30'
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {certificateFile ? (
              <div className="text-center">
                <span className="text-muted-foreground text-sm">
                  {certificateSelected}
                </span>
                <p className="text-foreground mt-1 font-medium">
                  {certificateFile.name}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground mb-3 text-sm">
                  {selectCertificate}
                </p>
                <Button type="button" variant="primary" size="sm">
                  {selectFileToUpload}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              id="cert-upload"
              type="file"
              accept=".cert"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {errors.certificate && (
            <p className="text-destructive text-sm">{errors.certificate}</p>
          )}
        </div>

        {/* Other Options */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">{otherOptions}</h4>

          <Switch
            checked={forceReauth}
            onCheckedChange={setForceReauth}
            label={forceReauthentication}
            description={forceReauthenticationDescription}
            id="force-reauth"
          />

          <Switch
            checked={idpSigns}
            onCheckedChange={setIdpSigns}
            label={idpSignsRequest}
            description={idpSignsRequestDescription}
            id="idp-signs"
          />

          <Switch
            checked={allowUnencrypted}
            onCheckedChange={setAllowUnencrypted}
            label={allowUnencryptedAssertion}
            description={allowUnencryptedAssertionDescription}
            id="allow-unencrypted"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <Button type="submit" variant="primary">
            {save}
          </Button>

          {hasExistingConfig && onDelete && (
            <Button type="button" variant="danger" onClick={onDelete}>
              {deleteLabel}
            </Button>
          )}

          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {cancel}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default SSOConfigForm;
