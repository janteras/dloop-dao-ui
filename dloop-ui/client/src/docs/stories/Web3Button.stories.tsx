import type { Meta, StoryObj } from '@storybook/react';
import { Web3Button } from '@/components/web3/unified/Web3Button';
import { useAppConfig } from '@/config/app-config';

const meta: Meta<typeof Web3Button> = {
  title: 'Web3/Unified/Web3Button',
  component: Web3Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A unified wallet connection button that works with both Ethers and Wagmi implementations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive', 'success'],
      description: 'Button variant style',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'icon'],
      description: 'Button size',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    showFullAddress: {
      control: 'boolean',
      description: 'Whether to show the full wallet address',
      table: {
        defaultValue: { summary: false },
      },
    },
    showBalance: {
      control: 'boolean',
      description: 'Whether to show wallet balance',
      table: {
        defaultValue: { summary: false },
      },
    },
    showNetwork: {
      control: 'boolean',
      description: 'Whether to show the connected network',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Web3Button>;

// Mock implementation switch for the story
const ImplementationToggle = () => {
  const { useWagmi, setUseWagmi } = useAppConfig();
  
  return (
    <div className="mb-4 p-3 bg-dark-bg border border-dark-gray rounded-md">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={useWagmi}
          onChange={e => setUseWagmi(e.target.checked)}
        />
        <span>Using {useWagmi ? 'Wagmi' : 'Ethers'} implementation</span>
      </label>
    </div>
  );
};

// Basic example with default settings
export const Default: Story = {
  render: (args) => (
    <div>
      <ImplementationToggle />
      <Web3Button {...args} />
    </div>
  ),
};

// Connected example showing the dropdown
export const Connected: Story = {
  args: {
    showBalance: true,
    showNetwork: true,
  },
  render: (args) => (
    <div>
      <ImplementationToggle />
      <p className="mb-2 text-sm text-gray-400">
        Note: This is just a visual example showing how the button would look when connected.
        The actual connection functionality is not mocked in this story.
      </p>
      <Web3Button {...args} />
    </div>
  ),
};

// Full configuration example
export const FullConfig: Story = {
  args: {
    variant: 'outline',
    size: 'md',
    showFullAddress: true,
    showBalance: true,
    showNetwork: true,
    customActions: [
      {
        label: 'View transactions',
        onClick: () => console.log('View transactions'),
      },
      {
        label: 'Switch network',
        onClick: () => console.log('Switch network'),
      },
    ],
  },
  render: (args) => (
    <div>
      <ImplementationToggle />
      <Web3Button {...args} />
    </div>
  ),
};

// Sizes example
export const Sizes: Story = {
  render: () => (
    <div>
      <ImplementationToggle />
      <div className="space-y-2">
        <Web3Button size="xs" />
        <Web3Button size="sm" />
        <Web3Button size="md" />
        <Web3Button size="lg" />
      </div>
    </div>
  ),
};

// Variants example
export const Variants: Story = {
  render: () => (
    <div>
      <ImplementationToggle />
      <div className="space-y-2">
        <Web3Button variant="primary" />
        <Web3Button variant="secondary" />
        <Web3Button variant="outline" />
        <Web3Button variant="ghost" />
        <Web3Button variant="link" />
        <Web3Button variant="destructive" />
        <Web3Button variant="success" />
      </div>
    </div>
  ),
};
