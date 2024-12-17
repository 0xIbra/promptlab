import React, { createContext, useContext, useState } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

const LoadingContext = createContext({
    isLoading: false,
    message: '',
    setLoading: () => {},
});

export function LoadingProvider({ children }) {
    const [state, setState] = useState({
        isLoading: false,
        message: ''
    });

    const setLoading = (isLoading, message = '') => {
        setState({ isLoading, message });
    };

    return (
        <LoadingContext.Provider value={{ ...state, setLoading }}>
            {children}
            {state.isLoading && <LoadingOverlay message={state.message} />}
        </LoadingContext.Provider>
    );
}

export const useLoading = () => useContext(LoadingContext);