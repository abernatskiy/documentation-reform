import React, { useState, useEffect, useMemo } from 'react';

interface NetworkData {
  chainId: number;
  chainName: string;
  id: string;
  isTestnet?: boolean;
  logoUrl: string;
  network: string;
  providers: Array<{
    data: Array<string | { name: string; ranges: Array<[number | string | null, number | string | null]> }>;
    dataSourceUrl: string;
    provider: string;
    release: string;
    supportTier: number;
  }>;
}

interface NetworkCheckerProps {
  className?: string;
}

const NetworkChecker: React.FC<NetworkCheckerProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [networks, setNetworks] = useState<NetworkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const response = await fetch('/json/evm.json');
        const data = await response.json();
        setNetworks(data.archives || []);
      } catch (error) {
        console.error('Failed to load network data:', error);
        setNetworks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks();
  }, []);

  const filteredNetworks = useMemo(() => {
    if (!searchTerm) return networks; // Show all networks by default
    
    const searchLower = searchTerm.toLowerCase();
    return networks.filter(network => 
      network.chainName.toLowerCase().includes(searchLower) ||
      network.chainId.toString().startsWith(searchTerm) ||
      network.id.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  }, [searchTerm, networks]);

  const handleNetworkSelect = (network: NetworkData) => {
    setSelectedNetwork(network);
    setSearchTerm(network.chainName);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedNetwork(null);
    setIsDropdownOpen(true);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for click events
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  const getAvailableData = (network: NetworkData) => {
    const allData = new Set<string>();
    network.providers.forEach(provider => {
      provider.data.forEach(item => {
        if (typeof item === 'string') {
          allData.add(item);
        } else {
          allData.add(item.name);
        }
      });
    });
    return Array.from(allData).sort();
  };

  if (loading) {
    return (
      <div className={`network-checker ${className}`}>
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
          Loading network data...
        </div>
      </div>
    );
  }

  return (
    <div className={`network-checker ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search by network name or chain ID..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {isDropdownOpen && filteredNetworks.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredNetworks.map((network) => (
              <div
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 bg-white !bg-white"
                style={{ backgroundColor: 'white' }}
              >
                {network.logoUrl && (
                  <img 
                    src={network.logoUrl} 
                    alt={network.chainName}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium">{network.chainName}</div>
                  <div className="text-sm text-gray-500">
                    Chain ID: {network.chainId}
                    {network.isTestnet && <span className="ml-2 text-orange-600">(Testnet)</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNetwork && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            {selectedNetwork.logoUrl && (
              <img 
                src={selectedNetwork.logoUrl} 
                alt={selectedNetwork.chainName}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <h3 className="font-semibold text-green-800">{selectedNetwork.chainName}</h3>
              <p className="text-sm text-green-600">Chain ID: {selectedNetwork.chainId}</p>
            </div>
          </div>
          
          <div className="mt-3">
            <h4 className="font-medium text-green-800 mb-2">Available Data:</h4>
            <div className="flex flex-wrap gap-2">
              {getAvailableData(selectedNetwork).map((dataType) => (
                <span
                  key={dataType}
                  className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md"
                >
                  {dataType}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {searchTerm && !selectedNetwork && filteredNetworks.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Data for <strong>{searchTerm}</strong> is not in the data lake. You can still ingest from RPC.
          </p>
        </div>
      )}
    </div>
  );
};

export default NetworkChecker; 