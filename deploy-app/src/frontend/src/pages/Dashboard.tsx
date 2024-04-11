import { useContext, useEffect, useState } from 'react';
import { Container, Typography, Tabs, Tab, Box, Paper, Chip, CircularProgress } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import { GitService } from '../services/git.service';
import BasicTableWithActions from '../components/BasicTableWithActions';
import DeployButton from '../components/DeployButton';
import GlobalContext from '../contexts/GlobalContext';

interface TagDataDTO {
    tag: string;
    directory: string;
    environment: string;
}

interface K8STableRow {
    version: string;
    backend_image: string;
    frontend_image: string;
    summary: string;
    assigned_to: string;
}

interface E2TableRow {
    version: string;
    summary: string;
    assigned_to: string;
}

interface GetConfigsDto {
    directory_name: string;
    application_name: string;
    application_type: string;
}

interface ConfigApplicationVersionDetailDto {
    image: string;
}

interface ConfigApplicationVersionDto {
    backend: ConfigApplicationVersionDetailDto;
    frontend: ConfigApplicationVersionDetailDto;
    summary: string;
}

interface ConfigApplicationVersionsDto {
    [key: string]: ConfigApplicationVersionDto;
}

interface ConfigApplicationEnvsDto {
    [key: string]: string;
}

interface ConfigApplicationDto {
    name: string;
    type: string;
    envs: ConfigApplicationEnvsDto;
    versions: ConfigApplicationVersionsDto;
}

const gitService = new GitService();

const getRowsForApp = (appData: ConfigApplicationDto, envs: ConfigApplicationEnvsDto) => {
    const { versions, type } = appData;

    if (type === 'k8s') {
        return Object.keys(versions).map(version => ({
            version,
            backend_image: versions[version].backend?.image || 'N/A',
            frontend_image: versions[version].frontend?.image || 'N/A',
            summary: versions[version].summary || 'No summary available',
            assigned_to: environmentsForVersions(version, envs) || 'N/A',
        }));
    } else {
        return Object.keys(versions).map(version => ({
            version,
            summary: versions[version].summary || 'No summary available',
            assigned_to: environmentsForVersions(version, envs) || 'N/A',
        }));
    }
};

const environmentsForVersions = (version: string, envs: ConfigApplicationEnvsDto): string => {
    return Object.entries(envs)
        .filter(([_env, ver]) => ver === version)
        .map(([env]) => env)
        .join(', ');
};

const Dashboard = () => {
    const [selectedTab, setSelectedTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dashboardState, setDashboardState] = useState<{
        config: GetConfigsDto[],
        selectedEnv: ConfigApplicationEnvsDto,
        tableRows: (K8STableRow[] | E2TableRow[])
    }>({
        config: [],
        selectedEnv: {},
        tableRows: []
    });

    const { addSnackBar } = useContext(GlobalContext);

    const k8sTableColumns = [
        {label: 'Version', field: 'version'}, 
        {label: 'Summary', field: 'summary'},
        {label: 'Backend Image', field: 'backend_image'}, 
        {label: 'Frontend Image', field: 'frontend_image'},
        {label: 'Assigned To', field: 'assigned_to'},
    ];

    const e2TableColumns = [
        {label: 'Version', field: 'version'}, 
        {label: 'Summary', field: 'summary'},
        {label: 'Assigned To', field: 'assigned_to'},
    ];

    // new state management functions
    const loadDataForTab = async (directoryName: string) => {
        setLoading(true);
        try {
            const configData = await gitService.getConfig(directoryName);
            const versionData = await gitService.getVersions(directoryName);
            setDashboardState(prevState => ({
                ...prevState,
                selectedEnv: configData.application.envs,
                tableRows: getRowsForApp(versionData.application, configData.application.envs)
            }));
        } catch (error: Error|any) {
            let message = `Error: ${error.response?.data?.detail || error.message}`;
            if (addSnackBar) {
                addSnackBar({ message, type: 'error', duration: 10000 });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        gitService.getConfigs().then(data => {
            setDashboardState(prevState => ({
                ...prevState,
                config: data
            }));

            if (data.length > 0) {
                loadDataForTab(data[0].directory_name);
            }
        });
    }, []);


    useEffect(() => {
        if (dashboardState.config.length > 0) {
            const directoryName = dashboardState.config[selectedTab].directory_name;
            loadDataForTab(directoryName);
        }
    }, [selectedTab, dashboardState.config]);

    const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
        // If needed, trigger data loading for the newly selected tab
        if (dashboardState.config.length > newValue) {
            loadDataForTab(dashboardState.config[newValue].directory_name);
        }
    };

    const k8sActionsColumn = (row: K8STableRow) => {
        const handleOnSelection = (env: string) => {
            // Access the directory name from the unified state object
            const directory = dashboardState.config[selectedTab]?.directory_name;
    
            const tagData = {
                tag: row.version,
                directory: directory,
                environment: env,
            } as TagDataDTO;
    
            gitService.deployVersion(tagData).then(() => {
                let message = `Deployed ${row.version} to ${env}`;
                if (addSnackBar) {
                    addSnackBar({ message, type: 'success', duration: 5000 });
                }

                // update the state by calling the loadDataForTab function
                loadDataForTab(directory);
            }).catch((error) => {
                let message = `Error: ${error.response?.data?.detail || error.message}`;
                if (addSnackBar) {
                    addSnackBar({ message, type: 'error', duration: 10000 });
                }
            });
        };
    
        return <DeployButton onSelection={handleOnSelection} />;
    };

    const renderTabContent = (tabIndex: number) => {
        // Make sure to access the current state from `dashboardState`
        const currentConfig = dashboardState.config[tabIndex];
        if (!currentConfig) {
            return <Typography>Loading...</Typography>; // Or some other placeholder content
        }
    
        const rows = dashboardState.tableRows;
        const columns = currentConfig.application_type === 'k8s' ? k8sTableColumns : e2TableColumns;
    
        return <BasicTableWithActions keyColumn='version' columns={columns} rows={rows} actionColumn={k8sActionsColumn} />;
    };

    return (
        <MainLayout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Tagger
                </Typography>
                <Tabs value={selectedTab} onChange={handleTabChange} aria-label="dashboard tabs">
                    {dashboardState.config.map((item, index) => (
                        <Tab key={index} label={item.application_name} />
                    ))}
                </Tabs>
                <Box sx={{ mt: 2 }}>
                    {/* <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            Environment Versions
                        </Typography>
                        {Object.keys(dashboardState.selectedEnv).map((env, index) => (
                            <Chip key={index} label={`${env} : ${dashboardState.selectedEnv[env]}`} sx={{ m: 1 }} />
                        ))}
                    </Paper>
                    {renderTabContent(selectedTab)} */}

                    {/* Loading indicator */}
                    {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <Paper sx={{ p: 2, mb: 3 }}>
                                    <Typography variant="h6" component="h2" gutterBottom>
                                        Environment Versions
                                    </Typography>
                                    {Object.keys(dashboardState.selectedEnv).map((env, index) => (
                                        <Chip key={index} label={`${env} : ${dashboardState.selectedEnv[env]}`} sx={{ m: 1 }} />
                                    ))}
                                </Paper>
                                {renderTabContent(selectedTab)}
                            </>
                        )}
                </Box>
            </Container>
        </MainLayout>
    );
};

export default Dashboard;
