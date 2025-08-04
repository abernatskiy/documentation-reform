import React, { useState, useEffect, useMemo } from 'react';

interface SubstrateNetworkData {
  name: string;
  displayName: string;
  tokens: string[];
  website: string;
  description: string;
  relayChain: string | null;
  parachainId: string | null;
}

interface SubstrateNetworkCheckerProps {
  className?: string;
}

const SubstrateNetworkChecker: React.FC<SubstrateNetworkCheckerProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<SubstrateNetworkData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [networks, setNetworks] = useState<SubstrateNetworkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const response = await fetch('/json/substrate.json');
        const data = await response.json();
        setNetworks(data.networks || []);
      } catch (error) {
        console.error('Failed to load Substrate network data:', error);
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
      network.displayName.toLowerCase().includes(searchLower) ||
      network.name.toLowerCase().includes(searchLower) ||
      (network.parachainId && network.parachainId.startsWith(searchTerm)) ||
      (network.relayChain && network.relayChain.toLowerCase().includes(searchLower))
    ).slice(0, 10);
  }, [searchTerm, networks]);

  const handleNetworkSelect = (network: SubstrateNetworkData) => {
    setSelectedNetwork(network);
    setSearchTerm(network.displayName);
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

  if (loading) {
    return (
      <div className={`substrate-network-checker ${className}`}>
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
          Loading Substrate network data...
        </div>
      </div>
    );
  }

  return (
    <div className={`substrate-network-checker ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search by network name or parachain ID..."
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
                key={network.name}
                onClick={() => handleNetworkSelect(network)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 bg-white !bg-white"
                style={{ backgroundColor: 'white' }}
              >
                <div className="flex-1">
                  <div className="font-medium">{network.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {network.relayChain && (
                      <span className="mr-2">Relay: {network.relayChain}</span>
                    )}
                    {network.parachainId && (
                      <span>Parachain ID: {network.parachainId}</span>
                    )}
                    {network.tokens.length > 0 && (
                      <span className="ml-2">Token: {network.tokens.join(', ')}</span>
                    )}
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
            <h3 className="font-semibold text-green-800">{selectedNetwork.displayName}</h3>
            <p className="text-sm text-green-600">
              {selectedNetwork.relayChain && `Relay Chain: ${selectedNetwork.relayChain}`}
              {selectedNetwork.parachainId && ` | Parachain ID: ${selectedNetwork.parachainId}`}
            </p>
          </div>
          
          <div className="mt-3">
            <p className="text-green-800 font-medium">
              {selectedNetwork.displayName} data is in the lake
            </p>
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

export default SubstrateNetworkChecker; 