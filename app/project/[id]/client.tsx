'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  project: any;
  dropdownOptions: Record<string, any[]>;
}

export default function ProjectClient({ project, dropdownOptions }: Props) {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);

  const categoryLabels: Record<string, string> = {
    foundation_type: 'Foundation Type',
    wall_type: 'Wall Type',
    exterior_material: 'Exterior Material',
    roof_type: 'Roof Type',
    finish_level: 'Finish Level',
    framing_type: 'Framing Type',
    wall_height: 'Wall Height',
    roof_pitch: 'Roof Pitch',
    window_package: 'Window Package',
    door_package: 'Door Package',
    insulation_package: 'Insulation Package',
    hvac_system: 'HVAC System',
    flooring_package: 'Flooring Package',
    countertop_package: 'Countertop Package',
    cabinet_grade: 'Cabinet Grade',
    plumbing_package: 'Plumbing Package',
    electrical_package: 'Electrical Package',
    garage_type: 'Garage Type',
    gutter_type: 'Gutter Type',
  };

  const handleSelection = async (category: string, code: string) => {
    setSelections(prev => ({ ...prev, [category]: code }));
    
    // Save selection to database
    try {
      await fetch('/api/selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          category,
          optionCode: code,
        }),
      });
    } catch (error) {
      console.error('Failed to save selection:', error);
    }
  };

  const handleGenerateEstimate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          overheadPct: 10,
          profitPct: 10,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate estimate');
      const data = await res.json();
      setEstimate(data.estimate);
      router.refresh();
    } catch (error) {
      alert('Failed to generate estimate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMeasurementValue = (type: string) => {
    const measurement = project.measurements.find((m: any) => m.featureType === type);
    return measurement?.valueNum || measurement?.valueText || '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-slate-600">Project ID: {project.id.slice(0, 8)}</p>
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
        >
          ← Back to Home
        </a>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Project Information</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-slate-600">Square Feet</div>
            <div className="text-lg font-semibold">{getMeasurementValue('grossSqFt')} SF</div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Bedrooms</div>
            <div className="text-lg font-semibold">{getMeasurementValue('bedroomCount')}</div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Bathrooms</div>
            <div className="text-lg font-semibold">{getMeasurementValue('bathroomCount')}</div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Region</div>
            <div className="text-lg font-semibold">{project.region?.name || 'Southeast US'}</div>
          </div>
        </div>
      </div>

      {/* Specifications Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Select Specifications</h2>
        <p className="text-slate-600 mb-6">
          Choose your specifications below. These will be used to calculate the final estimate.
        </p>
        
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(dropdownOptions).map(([category, options]) => (
            <div key={category}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {categoryLabels[category] || category}
              </label>
              <select
                value={selections[category] || ''}
                onChange={(e) => handleSelection(category, e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerateEstimate}
          disabled={generating || Object.keys(selections).length < 5}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? 'Generating Estimate...' : 'Generate Complete Estimate'}
        </button>
        
        {Object.keys(selections).length < 5 && (
          <p className="text-sm text-slate-500 text-center mt-2">
            Select at least 5 specifications to generate estimate
          </p>
        )}
      </div>

      {/* Estimate Results */}
      {(estimate || project.estimates[0]) && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Estimate Summary</h2>
          
          {estimate && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                <span className="text-slate-700">Materials Subtotal</span>
                <span className="text-xl font-bold">{formatCurrency(estimate.subtotalMaterial)}</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                <span className="text-slate-700">Labor Subtotal</span>
                <span className="text-xl font-bold">{formatCurrency(estimate.subtotalLabor)}</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                <span className="text-slate-700">Overhead (10%)</span>
                <span className="text-xl font-bold">{formatCurrency(estimate.overhead)}</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                <span className="text-slate-700">Profit (10%)</span>
                <span className="text-xl font-bold">{formatCurrency(estimate.profit)}</span>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-6 flex justify-between items-center">
                <span className="text-xl font-semibold">TOTAL PROJECT COST</span>
                <span className="text-4xl font-bold">{formatCurrency(estimate.totalAmount)}</span>
              </div>

              {/* Line Items Preview */}
              {estimate.lineItems && estimate.lineItems.length > 0 && (
                <div className="mt-6 bg-white rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-3">Line Items (Top 10)</h3>
                  <div className="space-y-2">
                    {estimate.lineItems.slice(0, 10).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-100">
                        <div>
                          <span className="font-medium">{item.description}</span>
                          <span className="text-slate-500 ml-2">
                            ({item.quantity.toFixed(2)} {item.unit} @ {formatCurrency(item.unitCost)}/{item.unit})
                          </span>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.extended)}</span>
                      </div>
                    ))}
                    {estimate.lineItems.length > 10 && (
                      <p className="text-sm text-slate-500 text-center pt-2">
                        + {estimate.lineItems.length - 10} more items
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> This estimate is based on AI-extracted quantities and your selected specifications. 
          Adjust specifications above to see how different choices affect the total cost.
        </p>
      </div>
    </div>
  );
}
