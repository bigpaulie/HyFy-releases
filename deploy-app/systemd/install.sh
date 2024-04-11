#!/bin/bash

# Get the current working directory
current_dir=$(pwd)

# The name of your service, script, and the relative path to the root of the git repository
service_name="update-k8s-deployments"
script_name="update-k8s-deployments.sh"
config_file="config.yaml"
service_template="${service_name}.service.template"
service_file="/etc/systemd/system/${service_name}.service"

# Calculate the path to the root of the git repository (two levels up from the current directory)
repo_dir="$(dirname "$(dirname "$current_dir")")"

# Check if the git repository directory exists and pull the latest changes
if [ -d "$repo_dir" ]; then
    echo "Updating git repository in $repo_dir..."
    git -C "$repo_dir" pull
else
    echo "Git repository directory not found: $repo_dir"
    exit 1
fi

# Check if the service template file exists
if [ ! -f "$current_dir/$service_template" ]; then
    echo "Service template file not found: $service_template"
    exit 1
fi

# Replace the placeholder in the service file template with the actual path
sed "s|/path/to/repo|$current_dir|g" "$current_dir/$service_template" > "$service_file"
sed "s|/path/to|$current_dir|g" "$current_dir/$service_template" > "$service_file"

# Ensure the script and config file are present and executable
if [ ! -f "$current_dir/$script_name" ] || [ ! -f "$current_dir/$config_file" ]; then
    echo "Script or config file not found in $current_dir"
    exit 1
fi

# Make the script executable
chmod +x "$current_dir/$script_name"

# Reload systemd to recognize the new service
systemctl daemon-reload

# Enable and start the service
systemctl enable "$service_name"
systemctl start "$service_name"

echo "Service $service_name has been installed and started."
