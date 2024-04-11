import { useState, useEffect } from 'react';
import { GitService } from '../services/git.service';

const useConfigurations = (directoryName: string) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const gitService = new GitService();
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await gitService.getConfig(directoryName);
                setConfig(data);
                setError(null);
            } catch (err: any) {
                setError(err);
                setConfig(null);
            } finally {
                setLoading(false);
            }
        };

        if (directoryName) {
            fetchData();
        }
    }, [directoryName]);

    return { config, loading, error };
};

export default useConfigurations;