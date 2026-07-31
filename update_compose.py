import yaml

def update_compose(file_path, is_prod=True):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = yaml.load(f, Loader=yaml.RoundTripLoader) if hasattr(yaml, 'RoundTripLoader') else yaml.safe_load(f)
        
    apps_to_update = ['accounts', 'app', 'admin', 'business', 'developers']
    
    for app in apps_to_update:
        if app in data.get('services', {}):
            service = data['services'][app]
            
            # Ensure build -> args exists
            if 'build' not in service:
                service['build'] = {}
            if 'args' not in service['build']:
                service['build']['args'] = [] if is_prod else {}
            
            # Ensure environment exists
            if 'environment' not in service:
                service['environment'] = {}
            
            if is_prod:
                # We need to use dictionary for args if it's currently a list, but wait, list is fine. Let's just use dictionary for both to be consistent, or list for both.
                # Actually, dict is easier to update.
                if isinstance(service['build']['args'], list):
                    new_args = {}
                    for item in service['build']['args']:
                        if '=' in item:
                            k, v = item.split('=', 1)
                            new_args[k] = v
                    service['build']['args'] = new_args
                    
                service['build']['args']['API_BACKEND_URL'] = 'http://api:3001'
                service['build']['args']['NEXT_PUBLIC_API_URL'] = '${NEXT_PUBLIC_API_EXTERNAL_URL:-https://api.rukny.io/api/v1}'
                service['build']['args']['NEXT_PUBLIC_APP_URL'] = '${NEXT_PUBLIC_APP_URL:-https://rukny.io}'
                service['build']['args']['NEXT_PUBLIC_ACCOUNTS_URL'] = '${AUTH_FRONTEND_URL:-https://accounts.rukny.io}'
                service['build']['args']['NEXT_PUBLIC_BUSINESS_URL'] = '${NEXT_PUBLIC_BUSINESS_URL:-https://business.rukny.io}'
                service['build']['args']['NEXT_PUBLIC_DEVELOPERS_URL'] = '${NEXT_PUBLIC_DEVELOPERS_URL:-https://developers.rukny.io}'
                service['build']['args']['NEXT_PUBLIC_FORMS_URL'] = '${NEXT_PUBLIC_FORMS_URL:-https://forms.rukny.io}'
                service['build']['args']['NEXT_PUBLIC_ROOT_DOMAIN'] = '${NEXT_PUBLIC_ROOT_DOMAIN:-rukny.io}'
                
                # Cleanup old wrong args
                if 'NEXT_PUBLIC_API_EXTERNAL_URL' in service['build']['args']:
                    del service['build']['args']['NEXT_PUBLIC_API_EXTERNAL_URL']
                
                # Update environment
                service['environment']['API_BACKEND_URL'] = 'http://api:3001'
                service['environment']['NEXT_PUBLIC_API_URL'] = '${NEXT_PUBLIC_API_EXTERNAL_URL:-https://api.rukny.io/api/v1}'
                service['environment']['NEXT_PUBLIC_APP_URL'] = '${NEXT_PUBLIC_APP_URL:-https://rukny.io}'
                service['environment']['NEXT_PUBLIC_ACCOUNTS_URL'] = '${AUTH_FRONTEND_URL:-https://accounts.rukny.io}'
                service['environment']['NEXT_PUBLIC_BUSINESS_URL'] = '${NEXT_PUBLIC_BUSINESS_URL:-https://business.rukny.io}'
                service['environment']['NEXT_PUBLIC_DEVELOPERS_URL'] = '${NEXT_PUBLIC_DEVELOPERS_URL:-https://developers.rukny.io}'
                service['environment']['NEXT_PUBLIC_FORMS_URL'] = '${NEXT_PUBLIC_FORMS_URL:-https://forms.rukny.io}'
                service['environment']['NEXT_PUBLIC_ROOT_DOMAIN'] = '${NEXT_PUBLIC_ROOT_DOMAIN:-rukny.io}'
                
                if 'NEXT_PUBLIC_API_EXTERNAL_URL' in service['environment']:
                    del service['environment']['NEXT_PUBLIC_API_EXTERNAL_URL']
                    
            else:
                if isinstance(service['build']['args'], list):
                    new_args = {}
                    for item in service['build']['args']:
                        if '=' in item:
                            k, v = item.split('=', 1)
                            new_args[k] = v
                    service['build']['args'] = new_args
                    
                service['build']['args']['API_BACKEND_URL'] = 'http://api:3001'
                service['build']['args']['NEXT_PUBLIC_API_URL'] = 'http://localhost:3001/api/v1'
                service['build']['args']['NEXT_PUBLIC_APP_URL'] = 'http://localhost:3000'
                service['build']['args']['NEXT_PUBLIC_ACCOUNTS_URL'] = 'http://localhost:3005'
                service['build']['args']['NEXT_PUBLIC_BUSINESS_URL'] = 'http://localhost:3003'
                service['build']['args']['NEXT_PUBLIC_DEVELOPERS_URL'] = 'http://localhost:3004'
                service['build']['args']['NEXT_PUBLIC_FORMS_URL'] = 'http://localhost:3006'
                service['build']['args']['NEXT_PUBLIC_ROOT_DOMAIN'] = 'localhost'
                
                if 'NEXT_PUBLIC_API_EXTERNAL_URL' in service['build']['args']:
                    del service['build']['args']['NEXT_PUBLIC_API_EXTERNAL_URL']
                if 'NEXT_PUBLIC_APP_ENV' in service['build']['args']:
                    del service['build']['args']['NEXT_PUBLIC_APP_ENV']
                
                service['environment']['API_BACKEND_URL'] = 'http://api:3001'
                service['environment']['NEXT_PUBLIC_API_URL'] = 'http://localhost:3001/api/v1'
                service['environment']['NEXT_PUBLIC_APP_URL'] = 'http://localhost:3000'
                service['environment']['NEXT_PUBLIC_ACCOUNTS_URL'] = 'http://localhost:3005'
                service['environment']['NEXT_PUBLIC_BUSINESS_URL'] = 'http://localhost:3003'
                service['environment']['NEXT_PUBLIC_DEVELOPERS_URL'] = 'http://localhost:3004'
                service['environment']['NEXT_PUBLIC_FORMS_URL'] = 'http://localhost:3006'
                service['environment']['NEXT_PUBLIC_ROOT_DOMAIN'] = 'localhost'
                
                if 'NEXT_PUBLIC_API_EXTERNAL_URL' in service['environment']:
                    del service['environment']['NEXT_PUBLIC_API_EXTERNAL_URL']
                if 'NEXT_PUBLIC_APP_ENV' in service['environment']:
                    del service['environment']['NEXT_PUBLIC_APP_ENV']

    # Dump
    with open(file_path, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False)

if __name__ == "__main__":
    update_compose('docker-compose.yml', True)
    update_compose('docker-compose.rukny-dev.yml', False)
    print("Updated files successfully")
