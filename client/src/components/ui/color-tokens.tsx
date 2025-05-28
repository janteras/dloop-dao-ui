import React from "react";

interface ColorSwatchProps {
  name: string;
  color: string;
  textColor?: string;
}

const ColorSwatch = ({ name, color, textColor = "text-foreground" }: ColorSwatchProps) => (
  <div className="space-y-2">
    <div 
      className={`h-16 rounded-md ${color} flex items-center justify-center ${textColor}`}
    >
      {name}
    </div>
    <div className="text-xs text-center">{name}</div>
  </div>
);

export const ColorTokens = () => (
  <div className="space-y-8 p-6 bg-card border border-border rounded-lg">
    <div>
      <h2 className="text-xl font-semibold mb-4">Base Semantic Colors</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ColorSwatch name="Primary" color="bg-primary" textColor="text-primary-foreground" />
        <ColorSwatch name="Secondary" color="bg-secondary" textColor="text-secondary-foreground" />
        <ColorSwatch name="Accent" color="bg-accent" textColor="text-accent-foreground" />
        <ColorSwatch name="Muted" color="bg-muted" textColor="text-muted-foreground" />
        <ColorSwatch name="Destructive" color="bg-destructive" textColor="text-destructive-foreground" />
        <ColorSwatch name="Success" color="bg-success" textColor="text-success-foreground" />
        <ColorSwatch name="Warning" color="bg-warning" textColor="text-warning-foreground" />
        <ColorSwatch name="Info" color="bg-info" textColor="text-info-foreground" />
      </div>
    </div>
    
    <div>
      <h2 className="text-xl font-semibold mb-4">Status Colors</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ColorSwatch name="Active" color="bg-status-active-bg text-status-active border border-status-active-border" />
        <ColorSwatch name="Passed" color="bg-status-passed-bg text-status-passed border border-status-passed-border" />
        <ColorSwatch name="Executed" color="bg-status-executed-bg text-status-executed border border-status-executed-border" />
        <ColorSwatch name="Failed" color="bg-status-failed-bg text-status-failed border border-status-failed-border" />
      </div>
    </div>
    
    <div>
      <h2 className="text-xl font-semibold mb-4">Proposal Type Colors</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ColorSwatch name="Invest" color="bg-proposal-invest-bg text-proposal-invest border border-proposal-invest-border" />
        <ColorSwatch name="Divest" color="bg-proposal-divest-bg text-proposal-divest border border-proposal-divest-border" />
        <ColorSwatch name="Parameter" color="bg-proposal-parameter-bg text-proposal-parameter border border-proposal-parameter-border" />
      </div>
    </div>

    <div>
      <h2 className="text-xl font-semibold mb-4">Badge Variants</h2>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-status-active-bg text-status-active border border-status-active-border">
          Active
        </span>
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-status-passed-bg text-status-passed border border-status-passed-border">
          Passed
        </span>
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-status-executed-bg text-status-executed border border-status-executed-border">
          Executed
        </span>
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-status-failed-bg text-status-failed border border-status-failed-border">
          Failed
        </span>
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-proposal-invest-bg text-proposal-invest border border-proposal-invest-border">
          Invest
        </span>
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-proposal-divest-bg text-proposal-divest border border-proposal-divest-border">
          Divest
        </span>
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-proposal-parameter-bg text-proposal-parameter border border-proposal-parameter-border">
          Parameter
        </span>
      </div>
    </div>
  </div>
);

export default ColorTokens;
