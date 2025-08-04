import React, { useState, useEffect, useMemo } from 'react';

interface SolanaNetworkData {
  id: string;
  chainName: string;
  isTestnet: boolean;
  network: string;
  providers: Array<{
    data: Array<{
      name: string;
      ranges: Array<[string | null, string | null]>;
    }>;
    dataSourceUrl: string;
    provider: string;
    release: string;
    supportTier: number;
  }>;
}

interface SolanaNetworkCheckerProps {
  className?: string;
}

const SolanaNetworkChecker: React.FC<SolanaNetworkCheckerProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<SolanaNetworkData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [networks, setNetworks] = useState<SolanaNetworkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const response = await fetch('/json/solana.json');
        const data = await response.json();
        setNetworks(data.archives || []);
      } catch (error) {
        console.error('Failed to load Solana network data:', error);
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
      network.id.toLowerCase().includes(searchLower) ||
      network.network.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  }, [searchTerm, networks]);

  const handleNetworkSelect = (network: SolanaNetworkData) => {
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

  const getAvailableData = (network: SolanaNetworkData) => {
    const allData = new Set<string>();
    network.providers.forEach(provider => {
      provider.data.forEach(item => {
        allData.add(item.name);
      });
    });
    return Array.from(allData).sort();
  };

  if (loading) {
    return (
      <div className={`solana-network-checker ${className}`}>
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
          Loading Solana network data...
        </div>
      </div>
    );
  }

  return (
    <div className={`solana-network-checker ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search by network name..."
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
                <div className="flex-1">
                  <div className="font-medium">{network.chainName}</div>
                  <div className="text-sm text-gray-500">
                    Network: {network.network}
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
          <div className="mb-3">
            <h3 className="font-semibold text-green-800">{selectedNetwork.chainName}</h3>
            <p className="text-sm text-green-600">
              Network: {selectedNetwork.network}
              {selectedNetwork.isTestnet && <span className="ml-2 text-orange-600">(Testnet)</span>}
            </p>
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

export default SolanaNetworkChecker; 