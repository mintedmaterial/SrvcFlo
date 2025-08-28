# Production Application

Your production application runs on AWS and its resources are defined in the `workspace/prd_resources.py` file. This guide shows how to:

1. [Build a production image](#build-your-production-image)
2. [Update ECS Task Definitions](#ecs-task-definition)
3. [Update ECS Services](#ecs-service)

## Workspace Settings

The `WorkspaceSettings` object in the `workspace/settings.py` file defines common settings used by your workspace apps and resources.

## Build your production image

Your application uses the `agno` images by default. To use your own image:

* Create a Repository in `ECR` and authenticate or use `Dockerhub`.
* Open `workspace/settings.py` file
* Update the `image_repo` to your image repository
* Set `build_images=True` and `push_images=True`
* Optional - Set `build_images=False` and `push_images=False` to use an existing image in the repository

### Create an ECR Repository

To use ECR, **create the image repo and authenticate with ECR** before pushing images.

**1. Create the image repository in ECR**

The repo name should match the `ws_name`. Meaning if you're using the default workspace name, the repo name would be `ai`.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/create-ecr-image.png" alt="create-ecr-image" />

**2. Authenticate with ECR**

```bash Authenticate with ECR
aws ecr get-login-password --region [region] | docker login --username AWS --password-stdin [account].dkr.ecr.[region].amazonaws.com
```

You can also use a helper script to avoid running the full command

<Note>
  Update the script with your ECR repo before running.
</Note>

<CodeGroup>
  ```bash Mac
  ./scripts/auth_ecr.sh
  ```
</CodeGroup>

### Update the `WorkspaceSettings`

```python workspace/settings.py
ws_settings = WorkspaceSettings(
    ...
    # Subnet IDs in the aws_region
    subnet_ids=["subnet-xyz", "subnet-xyz"],
    # -*- Image Settings
    # Repository for images
    image_repo="your-image-repo",
    # Build images locally
    build_images=True,
    # Push images after building
    push_images=True,
)
```

<Note>
  The `image_repo` defines the repo for your image.

  * If using dockerhub it would be something like `agno`.
  * If using ECR it would be something like `[ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com`
</Note>

### Build a new image

Build the production image using:

<CodeGroup>
  ```bash terminal
  ag ws up --env prd --infra docker --type image
  ```

  ```bash shorthand
  ag ws up -e prd -i docker -t image
  ```
</CodeGroup>

To `force` rebuild images, use the `--force` or `-f` flag

<CodeGroup>
  ```bash terminal
  ag ws up --env prd --infra docker --type image --force
  ```

  ```bash shorthand
  ag ws up -e prd -i docker -t image -f
  ```
</CodeGroup>

Because the only docker resources in the production env are docker images, you can also use:

<CodeGroup>
  ```bash Build Images
  ag ws up prd:docker
  ```

  ```bash Force Build Images
  ag ws up prd:docker -f
  ```
</CodeGroup>

## ECS Task Definition

If you updated the Image, CPU, Memory or Environment Variables, update the Task Definition using:

<CodeGroup>
  ```bash terminal
  ag ws patch --env prd --infra aws --name td
  ```

  ```bash shorthand
  ag ws patch -e prd -i aws -n td
  ```
</CodeGroup>

## ECS Service

To redeploy the production application, update the ECS Service using:

<CodeGroup>
  ```bash terminal
  ag ws patch --env prd --infra aws --name service
  ```

  ```bash shorthand
  ag ws patch -e prd -i aws -n service
  ```
</CodeGroup>

<br />

<Note>
  If you **ONLY** rebuilt the image, you do not need to update the task definition and can just patch the service to pickup the new image.
</Note>


# Add Python Libraries

Agno templates are setup to manage dependencies using a [pyproject.toml](https://packaging.python.org/en/latest/specifications/declaring-project-metadata/#declaring-project-metadata) file, **which is used to generate the `requirements.txt` file using [uv](https://github.com/astral-sh/uv) or [pip-tools](https://pip-tools.readthedocs.io/en/latest/).**

Adding or Updating a python library is a 2 step process:

1. Add library to the `pyproject.toml` file
2. Auto-Generate the `requirements.txt` file

<Warning>
  We highly recommend auto-generating the `requirements.txt` file using this process.
</Warning>

## Update pyproject.toml

* Open the `pyproject.toml` file
* Add new libraries to the dependencies section.

## Generate requirements

After updating the `dependencies` in the `pyproject.toml` file, auto-generate the `requirements.txt` file using a helper script or running `pip-compile` directly.

<CodeGroup>
  ```bash terminal
  ./scripts/generate_requirements.sh
  ```

  ```bash pip compile
  pip-compile \
      --no-annotate \
      --pip-args "--no-cache-dir" \
      -o requirements.txt pyproject.toml
  ```
</CodeGroup>

If you'd like to upgrade all python libraries to their latest version, run:

<CodeGroup>
  ```bash terminal
  ./scripts/generate_requirements.sh upgrade
  ```

  ```bash pip compile
  pip-compile \
      --upgrade \
      --no-annotate \
      --pip-args "--no-cache-dir" \
      -o requirements.txt pyproject.toml
  ```
</CodeGroup>

## Rebuild Images

After updating the `requirements.txt` file, rebuild your images.

### Rebuild dev images

<CodeGroup>
  ```bash terminal
  ag ws up --env dev --infra docker --type image
  ```

  ```bash short options
  ag ws up -e dev -i docker -t image
  ```
</CodeGroup>

### Rebuild production images

<Note>
  Remember to [authenticate with ECR](workspaces/workspace-management/production-app#ecr-images) if needed.
</Note>

<CodeGroup>
  ```bash terminal
  ag ws up --env prd --infra aws --type image
  ```

  ```bash short options
  ag ws up -e prd -i aws -t image
  ```
</CodeGroup>

## Recreate Resources

After rebuilding images, recreate the resources.

### Recreate dev containers

<CodeGroup>
  ```bash terminal
  ag ws restart --env dev --infra docker --type container
  ```

  ```bash short options
  ag ws restart -e dev -c docker -t container
  ```
</CodeGroup>

### Update ECS services

<CodeGroup>
  ```bash terminal
  ag ws patch --env prd --infra aws --name service
  ```

  ```bash short options
  ag ws patch -e prd -i aws -n service
  ```
</CodeGroup>



# Add Secrets

Secret management is a critical part of your application security and should be taken seriously.

Local secrets are defined in the `worspace/secrets` directory which is excluded from version control (see `.gitignore`). Its contents should be handled with the same security as passwords.

Production secrets are managed by [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html).

<Note>
  Incase you're missing the secrets dir, copy `workspace/example_secrets`
</Note>

## Development Secrets

Apps running locally can read secrets using a `yaml` file, for example:

```python dev_resources.py
dev_fastapi = FastApi(
    ...
    # Read secrets from secrets/dev_app_secrets.yml
    secrets_file=ws_settings.ws_root.joinpath("workspace/secrets/dev_app_secrets.yml"),
)
```

## Production Secrets

`AWS Secrets` are used to manage production secrets, which are read by the production apps.

```python prd_resources.py
# -*- Secrets for production application
prd_secret = SecretsManager(
    ...
    # Create secret from workspace/secrets/prd_app_secrets.yml
    secret_files=[
        ws_settings.ws_root.joinpath("workspace/secrets/prd_app_secrets.yml")
    ],
)

# -*- Secrets for production database
prd_db_secret = SecretsManager(
    ...
    # Create secret from workspace/secrets/prd_db_secrets.yml
    secret_files=[ws_settings.ws_root.joinpath("workspace/secrets/prd_db_secrets.yml")],
)
```

Read the secret in production apps using:

<CodeGroup>
  ```python FastApi
  prd_fastapi = FastApi(
      ...
      aws_secrets=[prd_secret],
      ...
  )
  ```

  ```python RDS
  prd_db = DbInstance(
      ...
      aws_secret=prd_db_secret,
      ...
  )
  ```
</CodeGroup>

Production resources can also read secrets using yaml files but we highly recommend using [AWS Secrets](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html).


# Environment variables

Environment variables can be added to resources using the `env_vars` parameter or the `env_file` parameter pointing to a `yaml` file. Examples

```python dev_resources.py
dev_fastapi = FastApi(
    ...
    env_vars={
        "RUNTIME_ENV": "dev",
        # Get the OpenAI API key from the local environment
        "OPENAI_API_KEY": getenv("OPENAI_API_KEY"),
        # Database configuration
        "DB_HOST": dev_db.get_db_host(),
        "DB_PORT": dev_db.get_db_port(),
        "DB_USER": dev_db.get_db_user(),
        "DB_PASS": dev_db.get_db_password(),
        "DB_DATABASE": dev_db.get_db_database(),
        # Wait for database to be available before starting the application
        "WAIT_FOR_DB": ws_settings.dev_db_enabled,
        # Migrate database on startup using alembic
        # "MIGRATE_DB": ws_settings.prd_db_enabled,
    },
    ...
)
```

```python prd_resources.py
prd_fastapi = FastApi(
    ...
    env_vars={
        "RUNTIME_ENV": "prd",
        # Get the OpenAI API key from the local environment
        "OPENAI_API_KEY": getenv("OPENAI_API_KEY"),
        # Database configuration
        "DB_HOST": AwsReference(prd_db.get_db_endpoint),
        "DB_PORT": AwsReference(prd_db.get_db_port),
        "DB_USER": AwsReference(prd_db.get_master_username),
        "DB_PASS": AwsReference(prd_db.get_master_user_password),
        "DB_DATABASE": AwsReference(prd_db.get_db_name),
        # Wait for database to be available before starting the application
        "WAIT_FOR_DB": ws_settings.prd_db_enabled,
        # Migrate database on startup using alembic
        # "MIGRATE_DB": ws_settings.prd_db_enabled,
    },
    ...
)
```

The apps in your templates are already configured to read environment variables.


# Environment variables

Environment variables can be added to resources using the `env_vars` parameter or the `env_file` parameter pointing to a `yaml` file. Examples

```python dev_resources.py
dev_fastapi = FastApi(
    ...
    env_vars={
        "RUNTIME_ENV": "dev",
        # Get the OpenAI API key from the local environment
        "OPENAI_API_KEY": getenv("OPENAI_API_KEY"),
        # Database configuration
        "DB_HOST": dev_db.get_db_host(),
        "DB_PORT": dev_db.get_db_port(),
        "DB_USER": dev_db.get_db_user(),
        "DB_PASS": dev_db.get_db_password(),
        "DB_DATABASE": dev_db.get_db_database(),
        # Wait for database to be available before starting the application
        "WAIT_FOR_DB": ws_settings.dev_db_enabled,
        # Migrate database on startup using alembic
        # "MIGRATE_DB": ws_settings.prd_db_enabled,
    },
    ...
)
```

```python prd_resources.py
prd_fastapi = FastApi(
    ...
    env_vars={
        "RUNTIME_ENV": "prd",
        # Get the OpenAI API key from the local environment
        "OPENAI_API_KEY": getenv("OPENAI_API_KEY"),
        # Database configuration
        "DB_HOST": AwsReference(prd_db.get_db_endpoint),
        "DB_PORT": AwsReference(prd_db.get_db_port),
        "DB_USER": AwsReference(prd_db.get_master_username),
        "DB_PASS": AwsReference(prd_db.get_master_user_password),
        "DB_DATABASE": AwsReference(prd_db.get_db_name),
        # Wait for database to be available before starting the application
        "WAIT_FOR_DB": ws_settings.prd_db_enabled,
        # Migrate database on startup using alembic
        # "MIGRATE_DB": ws_settings.prd_db_enabled,
    },
    ...
)
```

The apps in your templates are already configured to read environment variables.

# CI/CD

Agno templates come pre-configured with [Github Actions](https://docs.github.com/en/actions) for CI/CD. We can

1. [Test and Validate on every PR](#test-and-validate-on-every-pr)
2. [Build Docker Images with Github Releases](#build-docker-images-with-github-releases)
3. [Build ECR Images with Github Releases](#build-ecr-images-with-github-releases)

## Test and Validate on every PR

Whenever a PR is opened against the `main` branch, a validate script runs that ensures

1. The changes are formatted using ruff
2. All unit-tests pass
3. The changes don't have any typing or linting errors.

Checkout the `.github/workflows/validate.yml` file for more information.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/validate-cicd.png" alt="validate-cicd" />

## Build Docker Images with Github Releases

If you're using [Dockerhub](https://hub.docker.com/) for images, you can buld and push the images throug a Github Release. This action is defined in the `.github/workflows/docker-images.yml` file.

1. Create a [Docker Access Token](https://hub.docker.com/settings/security) for Github Actions

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/docker-access-token.png" alt="docker-access-token" />

2. Create secret variables `DOCKERHUB_REPO`, `DOCKERHUB_TOKEN` and `DOCKERHUB_USERNAME` in your github repo. These variables are used by the action in `.github/workflows/docker-images.yml`

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-actions-docker-secrets.png" alt="github-actions-docker-secrets" />

3. Run workflow using a Github Release

This workflow is configured to run when a release is created. Create a new release using:

<Note>
  Confirm the image name in the `.github/workflows/docker-images.yml` file before running
</Note>

<CodeGroup>
  ```bash Mac
  gh release create v0.1.0 --title "v0.1.0" -n ""
  ```

  ```bash Windows
  gh release create v0.1.0 --title "v0.1.0" -n ""
  ```
</CodeGroup>

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-actions-build-docker.png" alt="github-actions-build-docker" />

<Note>
  You can also run the workflow using `gh workflow run`
</Note>

## Build ECR Images with Github Releases

If you're using ECR for images, you can buld and push the images through a Github Release. This action is defined in the `.github/workflows/ecr-images.yml` file and uses the new OpenID Connect (OIDC) approach to request the access token, without using IAM access keys.

We will follow this [guide](https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/) to create an IAM role which will be used by the github action.

1. Open the IAM console.
2. In the left navigation menu, choose Identity providers.
3. In the Identity providers pane, choose Add provider.
4. For Provider type, choose OpenID Connect.
5. For Provider URL, enter the URL of the GitHub OIDC IdP: [https://token.actions.githubusercontent.com](https://token.actions.githubusercontent.com)
6. Get thumbprint to verify the server certificate
7. For Audience, enter sts.amazonaws.com.

Verify the information matches the screenshot below and Add provider

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-oidc-provider.png" alt="github-oidc-provider" />

8. Assign a Role to the provider.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-oidc-provider-assign-role.png" alt="github-oidc-provider-assign-role" />

9. Create a new role.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-oidc-provider-create-new-role.png" alt="github-oidc-provider-create-new-role" />

10. Confirm that Web identity is already selected as the trusted entity and the Identity provider field is populated with the IdP. In the Audience list, select sts.amazonaws.com, and then select Next.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-oidc-provider-trusted-entity.png" alt="github-oidc-provider-trusted-entity" />

11. Add the `AmazonEC2ContainerRegistryPowerUser` permission to this role.

12. Create the role with the name `GithubActionsRole`.

13. Find the role `GithubActionsRole` and copy the ARN.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-oidc-role.png" alt="github-oidc-role" />

14. Create the ECR Repositories: `llm` and `jupyter-llm` which are built by the workflow.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/create-ecr-image.png" alt="create-ecr-image" />

15. Update the workflow with the `GithubActionsRole` ARN and ECR Repository.

```yaml .github/workflows/ecr-images.yml
name: Build ECR Images

on:
  release:
    types: [published]

permissions:
  # For AWS OIDC Token access as per https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#updating-your-github-actions-workflow
  id-token: write # This is required for requesting the JWT
  contents: read # This is required for actions/checkout

env:
  ECR_REPO: [YOUR_ECR_REPO]
  # Create role using https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/
  AWS_ROLE: [GITHUB_ACTIONS_ROLE_ARN]
  AWS_REGION: us-east-1
```

16. Update the `docker-images` workflow to **NOT** run on a release

```yaml .github/workflows/docker-images.yml
name: Build Docker Images

on: workflow_dispatch
```

17. Run workflow using a Github Release

<CodeGroup>
  ```bash Mac
  gh release create v0.2.0 --title "v0.2.0" -n ""
  ```

  ```bash Windows
  gh release create v0.2.0 --title "v0.2.0" -n ""
  ```
</CodeGroup>

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/github-actions-build-ecr.png" alt="github-actions-build-ecr" />

<Note>
  You can also run the workflow using `gh workflow run`
</Note>


# Use Custom Domain and HTTPS

## Use a custom domain

1. Register your domain with [Route 53](https://us-east-1.console.aws.amazon.com/route53/).
2. Point the domain to the loadbalancer DNS.

### Custom domain for your Streamlit App

Create a record in the Route53 console to point `app.[YOUR_DOMAIN]` to the Streamlit App.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/llm-app-aidev-run.png" alt="llm-app-aidev-run" />

You can visit the app at [http://app.aidev.run](http://app.aidev.run)

<Note>Note the `http` in the domain name.</Note>

### Custom domain for your FastAPI App

Create a record in the Route53 console to point `api.[YOUR_DOMAIN]` to the FastAPI App.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/llm-api-aidev-run.png" alt="llm-api-aidev-run" />

You can access the api at [http://api.aidev.run](http://api.aidev.run)

<Note>Note the `http` in the domain name.</Note>

## Add HTTPS

To add HTTPS:

1. Create a certificate using [AWS ACM](https://us-east-1.console.aws.amazon.com/acm). Request a certificat for `*.[YOUR_DOMAIN]`

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/llm-app-request-cert.png" alt="llm-app-request-cert" />

2. Creating records in Route 53.

<img src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/llm-app-validate-cert.png" alt="llm-app-validate-cert" />

3. Add the certificate ARN to Apps

<Note>Make sure the certificate is `Issued` before adding it to your Apps</Note>

Update the `llm-app/workspace/prd_resources.py` file and add the `load_balancer_certificate_arn` to the `FastAPI` and `Streamlit` Apps.

```python workspace/prd_resources.py

# -*- Streamlit running on ECS
prd_streamlit = Streamlit(
    ...
    # To enable HTTPS, create an ACM certificate and add the ARN below:
    load_balancer_enable_https=True,
    load_balancer_certificate_arn="arn:aws:acm:us-east-1:497891874516:certificate/6598c24a-d4fc-4f17-8ee0-0d3906eb705f",
    ...
)

# -*- FastAPI running on ECS
prd_fastapi = FastApi(
    ...
    # To enable HTTPS, create an ACM certificate and add the ARN below:
    load_balancer_enable_https=True,
    load_balancer_certificate_arn="arn:aws:acm:us-east-1:497891874516:certificate/6598c24a-d4fc-4f17-8ee0-0d3906eb705f",
    ...
)
```

4. Create new Loadbalancer Listeners

Create new listeners for the loadbalancer to pickup the HTTPs configuration.

<CodeGroup>
  ```bash terminal
  ag ws up --env prd --infra aws --name listener
  ```

  ```bash shorthand
  ag ws up -e prd -i aws -n listener
  ```
</CodeGroup>

<Note>The certificate should be `Issued` before applying it.</Note>

After this, `https` should be working on your custom domain.

5. Update existing listeners to redirect HTTP to HTTPS

<CodeGroup>
  ```bash terminal
  ag ws patch --env prd --infra aws --name listener
  ```

  ```bash shorthand
  ag ws patch -e prd -i aws -n listener
  ```
</CodeGroup>

After this, all HTTP requests should redirect to HTTPS automatically.


# SSH Access

SSH Access is an important part of the developer workflow.

## Dev SSH Access

SSH into the dev containers using the `docker exec` command

```bash
docker exec -it ai-api zsh
```

## Production SSH Access

Your ECS tasks are already enabled with SSH access. SSH into the production containers using:

```bash
ECS_CLUSTER=ai-app-prd-cluster
TASK_ARN=$(aws ecs list-tasks --cluster ai-app-prd-cluster --query "taskArns[0]" --output text)
CONTAINER_NAME=ai-api-prd

aws ecs execute-command --cluster $ECS_CLUSTER \
    --task $TASK_ARN \
    --container $CONTAINER_NAME \
    --interactive \
    --command "zsh"
```


# Workspace Settings

The `WorkspaceSettings` object in the `workspace/settings.py` file defines common settings used by your apps and resources. Here are the settings we recommend updating:

```python workspace/settings.py
ws_settings = WorkspaceSettings(
    # Update this to your project name
    ws_name="ai",
    # Add your AWS subnets
    subnet_ids=["subnet-xyz", "subnet-xyz"],
    # Add your image repository
    image_repo="[ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com",
    # Set to True to build images locally
    build_images=True,
    # Set to True to push images after building
    push_images=True,
)
```

<Note>
  `WorkspaceSettings` can also be updated using environment variables or the `.env` file.

  Checkout the `example.env` file for an example.
</Note>

### Workspace Name

The `ws_name` is used to name your apps and resources. Change it to your project or team name, for example:

* `ws_name="booking-ai"`
* `ws_name="reddit-ai"`
* `ws_name="vantage-ai"`

The `ws_name` is used to name:

* The image for your application
* Apps like db, streamlit app and FastAPI server
* Resources like buckets, secrets and loadbalancers

Checkout the `workspace/dev_resources.py` and `workspace/prd_resources.py` file to see how its used.

## Image Repository

The `image_repo` defines the repo for your image.

* If using dockerhub it would be something like `agno`.
* If using ECR it would be something like `[ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com`

Checkout the `dev_image` in `workspace/dev_resources.py` and `prd_image` in `workspace/prd_resources.py` to see how its used.

## Build Images

Setting `build_images=True` will build images locally when running `ag ws up dev:docker` or `ag ws up prd:docker`.

Checkout the `dev_image` in `workspace/dev_resources.py` and `prd_image` in `workspace/prd_resources.py` to see how its used.

Read more about:

* [Building your development image](/workspaces/workspace-management/development-app#build-your-development-image)
* [Building your production image](/workspaces/workspace-management/production-app#build-your-production-image)

## Push Images

Setting `push_images=True` will push images after building when running `ag ws up dev:docker` or `ag ws up prd:docker`.

Checkout the `dev_image` in `workspace/dev_resources.py` and `prd_image` in `workspace/prd_resources.py` to see how its used.

Read more about:

* [Building your development image](/workspaces/workspace-management/development-app#build-your-development-image)
* [Building your production image](/workspaces/workspace-management/production-app#build-your-production-image)

## AWS Settings

The `aws_region` and `subnet_ids` provide values used for creating production resources. Checkout the `workspace/prd_resources.py` file to see how its used.


# Create Git Repo

Create a git repository to share your application with your team.

<Steps>
  <Step title="Create a git repository">
    Create a new [git repository](https://github.com/new).
  </Step>

  <Step title="Push your code">
    Push your code to the git repository.

    ```bash terminal
    git init
    git add .
    git commit -m "Init LLM App"
    git branch -M main
    git remote add origin https://github.com/[YOUR_GIT_REPO].git
    git push -u origin main
    ```
  </Step>

  <Step title="Ask your team to join">
    Ask your team to follow the [setup steps for new users](/workspaces/workspace-management/new-users) to use this workspace.
  </Step>
</Steps>


# Setup workspace for new users

Follow these steps to setup an existing workspace:

<Steps>
  <Step title="Clone git repository">
    Clone the git repo and `cd` into the workspace directory

    <CodeGroup>
      ```bash Mac
      git clone https://github.com/[YOUR_GIT_REPO].git

      cd your_workspace_directory
      ```

      ```bash Windows
      git clone https://github.com/[YOUR_GIT_REPO].git

      cd your_workspace_directory
      ```
    </CodeGroup>
  </Step>

  <Step title="Create and activate a virtual env">
    <CodeGroup>
      ```bash Mac
      python3 -m venv aienv
      source aienv/bin/activate
      ```

      ```bash Windows
      python3 -m venv aienv
      aienv/scripts/activate
      ```
    </CodeGroup>
  </Step>

  <Step title="Install agno">
    <CodeGroup>
      ```bash Mac
      pip install -U agno
      ```

      ```bash Windows
      pip install -U agno
      ```
    </CodeGroup>
  </Step>

  <Step title="Setup workspace">
    <CodeGroup>
      ```bash Mac
      ag ws setup
      ```

      ```bash Windows
      ag ws setup
      ```
    </CodeGroup>
  </Step>

  <Step title="Copy secrets">
    Copy `workspace/example_secrets` to `workspace/secrets`

    <CodeGroup>
      ```bash Mac
      cp -r workspace/example_secrets workspace/secrets
      ```

      ```bash Windows
      cp -r workspace/example_secrets workspace/secrets
      ```
    </CodeGroup>
  </Step>

  <Step title="Start workspace">
    <Note>
      Install [docker desktop](https://docs.docker.com/desktop/install/mac-install/) if needed.
    </Note>

    <CodeGroup>
      ```bash terminal
      ag ws up
      ```

      ```bash full options
      ag ws up --env dev --infra docker
      ```

      ```bash shorthand
      ag ws up dev:docker
      ```
    </CodeGroup>
  </Step>

  <Step title="Stop workspace">
    <CodeGroup>
      ```bash terminal
      ag ws down
      ```

      ```bash full options
      ag ws down --env dev --infra docker
      ```

      ```bash shorthand
      ag ws down dev:docker
      ```
    </CodeGroup>
  </Step>
</Steps>


# Setup workspace for new users

Follow these steps to setup an existing workspace:

<Steps>
  <Step title="Clone git repository">
    Clone the git repo and `cd` into the workspace directory

    <CodeGroup>
      ```bash Mac
      git clone https://github.com/[YOUR_GIT_REPO].git

      cd your_workspace_directory
      ```

      ```bash Windows
      git clone https://github.com/[YOUR_GIT_REPO].git

      cd your_workspace_directory
      ```
    </CodeGroup>
  </Step>

  <Step title="Create and activate a virtual env">
    <CodeGroup>
      ```bash Mac
      python3 -m venv aienv
      source aienv/bin/activate
      ```

      ```bash Windows
      python3 -m venv aienv
      aienv/scripts/activate
      ```
    </CodeGroup>
  </Step>

  <Step title="Install agno">
    <CodeGroup>
      ```bash Mac
      pip install -U agno
      ```

      ```bash Windows
      pip install -U agno
      ```
    </CodeGroup>
  </Step>

  <Step title="Setup workspace">
    <CodeGroup>
      ```bash Mac
      ag ws setup
      ```

      ```bash Windows
      ag ws setup
      ```
    </CodeGroup>
  </Step>

  <Step title="Copy secrets">
    Copy `workspace/example_secrets` to `workspace/secrets`

    <CodeGroup>
      ```bash Mac
      cp -r workspace/example_secrets workspace/secrets
      ```

      ```bash Windows
      cp -r workspace/example_secrets workspace/secrets
      ```
    </CodeGroup>
  </Step>

  <Step title="Start workspace">
    <Note>
      Install [docker desktop](https://docs.docker.com/desktop/install/mac-install/) if needed.
    </Note>

    <CodeGroup>
      ```bash terminal
      ag ws up
      ```

      ```bash full options
      ag ws up --env dev --infra docker
      ```

      ```bash shorthand
      ag ws up dev:docker
      ```
    </CodeGroup>
  </Step>

  <Step title="Stop workspace">
    <CodeGroup>
      ```bash terminal
      ag ws down
      ```

      ```bash full options
      ag ws down --env dev --infra docker
      ```

      ```bash shorthand
      ag ws down dev:docker
      ```
    </CodeGroup>
  </Step>
</Steps>
