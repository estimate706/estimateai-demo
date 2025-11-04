{result && (
  <div className="mt-6 rounded-xl border-2 border-green-200 bg-white p-6 shadow-lg">
    <h3 className="font-bold text-xl mb-4 text-green-800">✅ Analysis Results</h3>
    
    {/* Summary */}
    {result.summary && (
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
        <p className="text-sm text-blue-800 whitespace-pre-wrap">{result.summary}</p>
      </div>
    )}

    {/* Confidence */}
    {result.confidence !== undefined && (
      <div className="mb-6">
        <span className="text-sm font-medium text-slate-700">
          Confidence: {Math.round(result.confidence * 100)}%
        </span>
        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500"
            style={{ width: `${result.confidence * 100}%` }}
          ></div>
        </div>
      </div>
    )}

    {/* Items Table */}
    {result.items && result.items.length > 0 && (
      <div className="overflow-auto">
        <h4 className="font-semibold text-lg mb-3 text-slate-800">
          Extracted Items ({result.items.length})
        </h4>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <th className="text-left p-3 font-semibold">Category</th>
              <th className="text-left p-3 font-semibold">Description</th>
              <th className="text-right p-3 font-semibold">Quantity</th>
              <th className="text-center p-3 font-semibold">Unit</th>
              <th className="text-center p-3 font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-700 capitalize">
                  {item.category}
                </td>
                <td className="p-3 text-slate-800">{item.description}</td>
                <td className="p-3 text-right font-semibold text-slate-900">
                  {item.qty?.toLocaleString()}
                </td>
                <td className="p-3 text-center text-slate-600 uppercase font-medium">
                  {item.unit}
                </td>
                <td className="p-3 text-center">
                  {item.confidence !== undefined && (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      item.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(item.confidence * 100)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Raw JSON (expandable) */}
    <details className="mt-6">
      <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
        View Raw JSON
      </summary>
      <pre className="mt-3 p-4 bg-slate-100 rounded-lg text-xs overflow-auto max-h-64 border border-slate-300">
        {JSON.stringify(result, null, 2)}
      </pre>
    </details>
  </div>
)}

