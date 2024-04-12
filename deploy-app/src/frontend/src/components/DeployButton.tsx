import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TwoButtonsDialog from './TwoButtonsDialog';

interface DeployButtonProps {
    currentVersions: { [key: string]: string };
    possibleVersion: string;
    onSelection: (selection: string, fromVersion: string, toVersion: string) => void;
}

export default function DeployButton({ currentVersions, possibleVersion, onSelection }: DeployButtonProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = React.useState<string | null>(null);

  const open = Boolean(anchorEl);

  const handleMenuOpenClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const elementSelected = (environment: string) => {
    setSelectedEnvironment(environment);
    setOpenDialog(true);
  };

  const handleOnDialogConfirm = () => {
    if (selectedEnvironment) {
      onSelection(selectedEnvironment, currentVersions[selectedEnvironment] || "N/A", possibleVersion);
    }
    setOpenDialog(false);
    handleMenuClose();
  };

  const handleOnDialogCancel = () => {
    setOpenDialog(false);
    handleMenuClose();
  };

  // Create a message that dynamically updates based on the selected environment
  const dialogMessage = selectedEnvironment ? 
    `Are you sure you want to deploy from version ${currentVersions[selectedEnvironment] || "N/A"} to ${possibleVersion} onto ${selectedEnvironment}?` :
    "Are you sure?";

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleMenuOpenClick}
        variant='contained'
      >
        Deploy to
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={() => elementSelected('staging')}>Staging</MenuItem>
        <MenuItem onClick={() => elementSelected('qa')}>QA</MenuItem>
        <MenuItem onClick={() => elementSelected('preprod')}>Pre Prod</MenuItem>
        <MenuItem onClick={() => elementSelected('prod')}>Prod</MenuItem>
      </Menu>

      <TwoButtonsDialog 
          open={openDialog} 
          onCancel={handleOnDialogCancel} 
          onConfirm={handleOnDialogConfirm} 
          title="Confirm Deployment" 
          message={dialogMessage} />
    </div>
  );
}
