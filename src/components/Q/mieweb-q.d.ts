declare module '@mieweb/q' {
  import type * as React from 'react';

  export type QConfig = Record<string, unknown>;
  export type QSchema = Record<string, unknown>;
  export type QDownloadMode = 'yaml' | 'json';

  export interface AgentConfigGeneratorProps {
    initialConfig?: QConfig;
    schema?: QSchema;
    showEditor?: boolean;
    onConfigChange?: (config: QConfig) => void;
    onDownload?: (content: string, mode: QDownloadMode) => void;
    onSubmit?: (yamlString: string) => void;
  }

  export interface FormBuilderProps {
    config: QConfig;
    schema?: QSchema;
    onConfigChange?: (config: QConfig) => void;
  }

  export interface ConfigEditorProps {
    yamlOutput?: string;
    jsonOutput?: string;
    mode?: QDownloadMode;
    onChange?: (content: string, mode: QDownloadMode) => void;
  }

  export interface ToolBuilderProps {
    config: QConfig;
    onConfigChange?: (config: QConfig) => void;
  }

  export interface HeaderProps {
    onDownload?: () => void;
  }

  export const AgentConfigGenerator: React.ComponentType<AgentConfigGeneratorProps>;
  export const FormBuilder: React.ComponentType<FormBuilderProps>;
  export const ConfigEditor: React.ComponentType<ConfigEditorProps>;
  export const ToolBuilder: React.ComponentType<ToolBuilderProps>;
  export const Header: React.ComponentType<HeaderProps>;

  export const defaultSchema: QSchema;
  export const TIMEZONES: string[];
  export const GENERIC_TOOLS: QConfig[];

  export function deriveDefaultConfig(schema?: QSchema): QConfig;
  export function questionnaireToConfig(
    formData: QConfig,
    existingConfig?: QConfig
  ): QConfig;
  export function configToQuestionnaire(
    config: QConfig,
    schema?: QSchema
  ): QSchema;
  export function validateConfig(
    config: QConfig,
    schema?: QSchema
  ): { valid: boolean; errors: string[] };
  export function configToYaml(config: QConfig): string;
  export function yamlToConfig(yamlString: string): QConfig;
  export function downloadConfig(
    config: QConfig,
    yamlOutput: string,
    onDownload?: (content: string, mode: QDownloadMode) => void,
    mode?: QDownloadMode,
    jsonOutput?: string
  ): void;
  export function copyToClipboard(text: string): Promise<void>;
}

declare module '@mieweb/q/universal' {
  export interface UniversalAgentConfigGeneratorOptions {
    initialConfig?: Record<string, unknown>;
    schema?: Record<string, unknown>;
    showEditor?: boolean;
  }

  export class UniversalAgentConfigGenerator {
    constructor(
      target: string | HTMLElement,
      options?: UniversalAgentConfigGeneratorOptions
    );
    update(options: Partial<UniversalAgentConfigGeneratorOptions>): void;
    destroy(): void;
  }

  export const brands: Record<string, unknown>;
  export function generateBrandCSS(...args: unknown[]): string;
}

declare module '@mieweb/q/style.css';
