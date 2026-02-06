// React context for integrated services

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { IntegratedServices, initializeServices } from '../services';
import { useAuth } from './AuthContext';

interface ServicesContextType {
  services: IntegratedServices | null;
  serviceHealth: Record<string, boolean>;
  isInitialized: boolean;
}

const ServicesContext = createContext<ServicesContextType | undefined>(
  undefined
);

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};

interface ServicesProviderProps {
  children: ReactNode;
}

export const ServicesProvider: React.FC<ServicesProviderProps> = ({
  children,
}) => {
  const { accessToken, refreshAccessToken } = useAuth();
  const [services, setServices] = useState<IntegratedServices | null>(null);
  const [serviceHealth, setServiceHealth] = useState<Record<string, boolean>>(
    {}
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const getAccessToken = () => accessToken;
    const onTokenExpired = async () => {
      await refreshAccessToken();
    };

    const servicesInstance = initializeServices(getAccessToken, onTokenExpired);
    setServices(servicesInstance);
    setIsInitialized(true);

    // Update service health periodically
    const healthCheckInterval = setInterval(() => {
      if (servicesInstance) {
        setServiceHealth(servicesInstance.getServiceHealth());
      }
    }, 5000);

    return () => {
      clearInterval(healthCheckInterval);
      if (servicesInstance) {
        servicesInstance.stopHealthMonitoring();
      }
    };
  }, [accessToken, refreshAccessToken]);

  const value: ServicesContextType = {
    services,
    serviceHealth,
    isInitialized,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
