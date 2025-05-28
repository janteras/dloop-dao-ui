/**
 * Base component interface that all components should extend
 * Ensures consistent properties across the component library
 */
export interface BaseComponentProps {
  /** Unique identifier for the component */
  id?: string;
  /** Additional CSS classes to apply */
  className?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Interface for components that can be loaded
 */
export interface LoadableComponentProps extends BaseComponentProps {
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Component to show while loading */
  loadingComponent?: React.ReactNode;
}

/**
 * Interface for components that can have errors
 */
export interface ErrorableComponentProps extends BaseComponentProps {
  /** Error message to display */
  error?: string | null;
  /** Component to show when there's an error */
  errorComponent?: React.ReactNode;
}

/**
 * Interface for components with Web3 implementation variants
 */
export interface Web3ComponentProps extends BaseComponentProps {
  /** Whether to use Wagmi implementation (otherwise uses Ethers) */
  useWagmi?: boolean;
}

/**
 * Type of component based on its complexity level
 */
export enum ComponentType {
  ATOM = 'atom',
  MOLECULE = 'molecule',
  ORGANISM = 'organism',
  TEMPLATE = 'template',
  PAGE = 'page',
}

/**
 * Component category for organizational purposes
 */
export enum ComponentCategory {
  GENERAL = 'general',
  FORM = 'form',
  NAVIGATION = 'navigation',
  FEEDBACK = 'feedback',
  DATA_DISPLAY = 'data-display',
  WEB3 = 'web3',
  LAYOUT = 'layout',
}

/**
 * Metadata interface for component documentation
 */
export interface ComponentMetadata {
  /** Component name */
  name: string;
  /** Component description */
  description: string;
  /** Component type */
  type: ComponentType;
  /** Component category */
  category: ComponentCategory;
  /** Component author */
  author?: string;
  /** Component creation date */
  createdAt?: string;
  /** Component last updated date */
  updatedAt?: string;
}
