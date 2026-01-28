import type { Meta, StoryObj } from '@storybook/react';
import { SSOConfigForm } from './SSOConfigForm';

const meta: Meta<typeof SSOConfigForm> = {
  component: SSOConfigForm,
  title: 'Forms/SSOConfigForm',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
    onDelete: { action: 'deleted' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof SSOConfigForm>;

/**
 * Interactive playground for the SSOConfigForm component.
 */
export const Interactive: Story = {
  args: {
    hasExistingConfig: false,
  },
};

/**
 * Default new SSO configuration form.
 */
export const Default: Story = {
  args: {
    hasExistingConfig: false,
  },
};

/**
 * Editing an existing SSO configuration.
 */
export const ExistingConfig: Story = {
  args: {
    hasExistingConfig: true,
    initialData: {
      clientDomain: 'acme.com',
      ssoLoginUrl: 'https://idp.acme.com/saml/login',
      ssoLogoutUrl: 'https://idp.acme.com/saml/logout',
      forceReauthentication: false,
      idpSignsRequest: true,
      allowUnencryptedAssertion: false,
    },
  },
};

/**
 * Form with all options enabled.
 */
export const AllOptionsEnabled: Story = {
  args: {
    hasExistingConfig: true,
    initialData: {
      clientDomain: 'enterprise.com',
      ssoLoginUrl: 'https://sso.enterprise.com/auth',
      ssoLogoutUrl: 'https://sso.enterprise.com/logout',
      forceReauthentication: true,
      idpSignsRequest: true,
      allowUnencryptedAssertion: true,
    },
  },
};

/**
 * Form with minimal data (only required fields).
 */
export const MinimalConfig: Story = {
  args: {
    hasExistingConfig: false,
    initialData: {
      clientDomain: 'startup.io',
      ssoLoginUrl: 'https://auth.startup.io/sso',
    },
  },
};

/**
 * Form with cancel button.
 */
export const WithCancel: Story = {
  args: {
    hasExistingConfig: false,
    onCancel: () => {},
  },
};

/**
 * Form with custom labels for internationalization.
 */
export const CustomLabels: Story = {
  args: {
    hasExistingConfig: true,
    initialData: {
      clientDomain: 'empresa.es',
      ssoLoginUrl: 'https://sso.empresa.es/login',
    },
    labels: {
      title: 'Configurar Inicio de Sesión Único',
      clientDomain: 'Dominio del Cliente',
      clientDomainPlaceholder: 'ejemplo.com',
      invalidClientDomain: 'Por favor ingrese un dominio válido',
      ssoLoginUrl: 'URL de Inicio de Sesión SSO',
      ssoLoginUrlPlaceholder: 'https://idp.ejemplo.com/login',
      invalidSsoLoginUrl: 'Por favor ingrese una URL válida',
      ssoLogoutUrl: 'URL de Cierre de Sesión SSO',
      selectCertificate: 'Seleccione el archivo de certificado (.cert)',
      selectFileToUpload: 'Seleccionar Archivo',
      certificateSelected: 'Certificado seleccionado:',
      otherOptions: 'Otras Opciones de SSO',
      forceReauthentication: 'Forzar Re-autenticación',
      forceReauthenticationDescription:
        'Requiere que los usuarios se autentiquen cada vez',
      idpSignsRequest: 'IDP Firma la Solicitud',
      idpSignsRequestDescription:
        'Habilitar si su IDP firma la solicitud de autenticación',
      allowUnencryptedAssertion: 'Permitir Aserción Sin Encriptar',
      allowUnencryptedAssertionDescription:
        'Permitir aserciones sin encriptar (menos seguro)',
      save: 'Guardar Configuración SSO',
      delete: 'Eliminar SSO',
      cancel: 'Cancelar',
    },
  },
};

/**
 * Mobile viewport.
 */
export const Mobile: Story = {
  args: {
    hasExistingConfig: true,
    initialData: {
      clientDomain: 'mobile.app',
      ssoLoginUrl: 'https://auth.mobile.app/sso',
    },
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/**
 * Dark mode preview.
 */
export const DarkMode: Story = {
  args: {
    hasExistingConfig: true,
    initialData: {
      clientDomain: 'dark.corp',
      ssoLoginUrl: 'https://sso.dark.corp/login',
      forceReauthentication: true,
    },
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark bg-background rounded-lg p-4">
        <Story />
      </div>
    ),
  ],
};
