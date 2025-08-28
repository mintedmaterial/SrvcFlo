---
title: R2 Data Catalog · Cloudflare R2 docs
description: A managed Apache Iceberg data catalog built directly into R2 buckets.
lastUpdated: 2025-04-09T22:46:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/r2/data-catalog/
  md: https://developers.cloudflare.com/r2/data-catalog/index.md
---

Note

R2 Data Catalog is in **public beta**, and any developer with an [R2 subscription](https://developers.cloudflare.com/r2/pricing/) can start using it. Currently, outside of standard R2 storage and operations, you will not be billed for your use of R2 Data Catalog.

R2 Data Catalog is a managed [Apache Iceberg](https://iceberg.apache.org/) data catalog built directly into your R2 bucket. It exposes a standard Iceberg REST catalog interface, so you can connect the engines you already use, like [Spark](https://developers.cloudflare.com/r2/data-catalog/config-examples/spark-scala/), [Snowflake](https://developers.cloudflare.com/r2/data-catalog/config-examples/snowflake/), and [PyIceberg](https://developers.cloudflare.com/r2/data-catalog/config-examples/pyiceberg/).

R2 Data Catalog makes it easy to turn an R2 bucket into a data warehouse or lakehouse for a variety of analytical workloads including log analytics, business intelligence, and data pipelines. R2's zero-egress fee model means that data users and consumers can access and analyze data from different clouds, data platforms, or regions without incurring transfer costs.

To get started with R2 Data Catalog, refer to the [R2 Data Catalog: Getting started](https://developers.cloudflare.com/r2/data-catalog/get-started/).

## What is Apache Iceberg?

[Apache Iceberg](https://iceberg.apache.org/) is an open table format designed to handle large-scale analytics datasets stored in object storage. Key features include:

* ACID transactions - Ensures reliable, concurrent reads and writes with full data integrity.
* Optimized metadata - Avoids costly full table scans by using indexed metadata for faster queries.
* Full schema evolution - Allows adding, renaming, and deleting columns without rewriting data.

Iceberg is already [widely supported](https://iceberg.apache.org/vendors/) by engines like Apache Spark, Trino, Snowflake, DuckDB, and ClickHouse, with a fast-growing community behind it.

## Why do you need a data catalog?

Although the Iceberg data and metadata files themselves live directly in object storage (like [R2](https://developers.cloudflare.com/r2/)), the list of tables and pointers to the current metadata need to be tracked centrally by a data catalog.

Think of a data catalog as a library's index system. While books (your data) are physically distributed across shelves (object storage), the index provides a single source of truth about what books exist, their locations, and their latest editions. Without this index, readers (query engines) would waste time searching for books, might access outdated versions, or could accidentally shelve new books in ways that make them unfindable.

Similarly, data catalogs ensure consistent, coordinated access, which allows multiple query engines to safely read from and write to the same tables without conflicts or data corruption.

## Learn more

[Get started ](https://developers.cloudflare.com/r2/data-catalog/get-started/)Learn how to enable the R2 Data Catalog on your bucket, load sample data, and run your first query.

[Managing catalogs ](https://developers.cloudflare.com/r2/data-catalog/manage-catalogs/)Enable or disable R2 Data Catalog on your bucket, retrieve configuration details, and authenticate your Iceberg engine.

[Connect to Iceberg engines ](https://developers.cloudflare.com/r2/data-catalog/config-examples/)Find detailed setup instructions for Apache Spark and other common query engines.


---
title: Getting started · Cloudflare R2 docs
description: Learn how to enable the R2 Data Catalog on your bucket, load sample
  data, and run your first query.
lastUpdated: 2025-06-06T13:35:32.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/r2/data-catalog/get-started/
  md: https://developers.cloudflare.com/r2/data-catalog/get-started/index.md
---

## Overview

This guide will instruct you through:

* Creating your first [R2 bucket](https://developers.cloudflare.com/r2/buckets/) and enabling its [data catalog](https://developers.cloudflare.com/r2/data-catalog/).
* Creating an [API token](https://developers.cloudflare.com/r2/api/tokens/) needed for query engines to authenticate with your data catalog.
* Using [PyIceberg](https://py.iceberg.apache.org/) to create your first Iceberg table in a [marimo](https://marimo.io/) Python notebook.
* Using [PyIceberg](https://py.iceberg.apache.org/) to load sample data into your table and query it.

## Prerequisites

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Node.js version manager

Use a Node version manager like [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

## 1. Create an R2 bucket

* Wrangler CLI

  1. If not already logged in, run:

     ```plaintext
     npx wrangler login
     ```

  2. Create an R2 bucket:

     ```plaintext
     npx wrangler r2 bucket create r2-data-catalog-tutorial
     ```

* Dashboard

  1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.
  2. Select **Create bucket**.
  3. Enter the bucket name: r2-data-catalog-tutorial
  4. Select **Create bucket**.

## 2. Enable the data catalog for your bucket

* Wrangler CLI

  Then, enable the catalog on your chosen R2 bucket:

  ```plaintext
  npx wrangler r2 bucket catalog enable r2-data-catalog-tutorial
  ```

  When you run this command, take note of the "Warehouse" and "Catalog URI". You will need these later.

* Dashboard

  1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.
  2. Select the bucket: r2-data-catalog-tutorial.
  3. Switch to the **Settings** tab, scroll down to **R2 Data Catalog**, and select **Enable**.
  4. Once enabled, note the **Catalog URI** and **Warehouse name**.

## 3. Create an API token

Iceberg clients (including [PyIceberg](https://py.iceberg.apache.org/)) must authenticate to the catalog with a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) that has both R2 and catalog permissions.

1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.

2. Expand the **API** dropdown and select **Manage API tokens**.

3. Select **Create API token**.

4. Select the **R2 Token** text to edit your API token name.

5. Under **Permissions**, choose the **Admin Read & Write** permission.

6. Select **Create API Token**.

7. Note the **Token value**.

## 4. Install uv

You need to install a Python package manager. In this guide, use [uv](https://docs.astral.sh/uv/). If you do not already have uv installed, follow the [installing uv guide](https://docs.astral.sh/uv/getting-started/installation/).

## 5. Install marimo and set up your project with uv

We will use [marimo](https://github.com/marimo-team/marimo) as a Python notebook.

1. Create a directory where our notebook will be stored:

   ```plaintext
   mkdir r2-data-catalog-notebook
   ```

2. Change into our new directory:

   ```plaintext
   cd r2-data-catalog-notebook
   ```

3. Initialize a new uv project (this creates a `.venv` and a `pyproject.toml`):

   ```plaintext
   uv init
   ```

4. Add marimo and required dependencies:

   ```py
   uv add marimo pyiceberg pyarrow pandas
   ```

## 6. Create a Python notebook to interact with the data warehouse

1. Create a file called `r2-data-catalog-tutorial.py`.

2. Paste the following code snippet into your `r2-data-catalog-tutorial.py` file:

   ```py
   import marimo


   __generated_with = "0.11.31"
   app = marimo.App(width="medium")




   @app.cell
   def _():
       import marimo as mo
       return (mo,)




   @app.cell
   def _():
       import pandas
       import pyarrow as pa
       import pyarrow.compute as pc
       import pyarrow.parquet as pq


       from pyiceberg.catalog.rest import RestCatalog


       # Define catalog connection details (replace variables)
       WAREHOUSE = "<WAREHOUSE>"
       TOKEN = "<TOKEN>"
       CATALOG_URI = "<CATALOG_URI>"


       # Connect to R2 Data Catalog
       catalog = RestCatalog(
           name="my_catalog",
           warehouse=WAREHOUSE,
           uri=CATALOG_URI,
           token=TOKEN,
       )
       return (
           CATALOG_URI,
           RestCatalog,
           TOKEN,
           WAREHOUSE,
           catalog,
           pa,
           pandas,
           pc,
           pq,
       )




   @app.cell
   def _(catalog):
       # Create default namespace if needed
       catalog.create_namespace_if_not_exists("default")
       return




   @app.cell
   def _(pa):
       # Create simple PyArrow table
       df = pa.table({
           "id": [1, 2, 3],
           "name": ["Alice", "Bob", "Charlie"],
           "score": [80.0, 92.5, 88.0],
       })
       return (df,)




   @app.cell
   def _(catalog, df):
       # Create or load Iceberg table
       test_table = ("default", "people")
       if not catalog.table_exists(test_table):
           print(f"Creating table: {test_table}")
           table = catalog.create_table(
               test_table,
               schema=df.schema,
           )
       else:
           table = catalog.load_table(test_table)
       return table, test_table




   @app.cell
   def _(df, table):
       # Append data
       table.append(df)
       return




   @app.cell
   def _(table):
       print("Table contents:")
       scanned = table.scan().to_arrow()
       print(scanned.to_pandas())
       return (scanned,)




   @app.cell
   def _():
       # Optional cleanup. To run uncomment and run cell
       # print(f"Deleting table: {test_table}")
       # catalog.drop_table(test_table)
       # print("Table dropped.")
       return




   if __name__ == "__main__":
       app.run()
   ```

3. Replace the `CATALOG_URI`, `WAREHOUSE`, and `TOKEN` variables with your values from sections **2** and **3** respectively.

4. Launch the notebook editor in your browser:

   ```plaintext
   uv run marimo edit r2-data-catalog-tutorial.py
   ```

   Once your notebook connects to the catalog, you'll see the catalog along with its namespaces and tables appear in marimo's Datasources panel.

In the Python notebook above, you:

1. Connect to your catalog.
2. Create the `default` namespace.
3. Create a simple PyArrow table.
4. Create (or load) the `people` table in the `default` namespace.
5. Append sample data to the table.
6. Print the contents of the table.
7. (Optional) Drop the `people` table we created for this tutorial.

## Learn more

[Managing catalogs ](https://developers.cloudflare.com/r2/data-catalog/manage-catalogs/)Enable or disable R2 Data Catalog on your bucket, retrieve configuration details, and authenticate your Iceberg engine.

[Connect to Iceberg engines ](https://developers.cloudflare.com/r2/data-catalog/config-examples/)Find detailed setup instructions for Apache Spark and other common query engines.

---
title: Getting started · Cloudflare R2 docs
description: Learn how to enable the R2 Data Catalog on your bucket, load sample
  data, and run your first query.
lastUpdated: 2025-06-06T13:35:32.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/r2/data-catalog/get-started/
  md: https://developers.cloudflare.com/r2/data-catalog/get-started/index.md
---

## Overview

This guide will instruct you through:

* Creating your first [R2 bucket](https://developers.cloudflare.com/r2/buckets/) and enabling its [data catalog](https://developers.cloudflare.com/r2/data-catalog/).
* Creating an [API token](https://developers.cloudflare.com/r2/api/tokens/) needed for query engines to authenticate with your data catalog.
* Using [PyIceberg](https://py.iceberg.apache.org/) to create your first Iceberg table in a [marimo](https://marimo.io/) Python notebook.
* Using [PyIceberg](https://py.iceberg.apache.org/) to load sample data into your table and query it.

## Prerequisites

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Node.js version manager

Use a Node version manager like [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

## 1. Create an R2 bucket

* Wrangler CLI

  1. If not already logged in, run:

     ```plaintext
     npx wrangler login
     ```

  2. Create an R2 bucket:

     ```plaintext
     npx wrangler r2 bucket create r2-data-catalog-tutorial
     ```

* Dashboard

  1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.
  2. Select **Create bucket**.
  3. Enter the bucket name: r2-data-catalog-tutorial
  4. Select **Create bucket**.

## 2. Enable the data catalog for your bucket

* Wrangler CLI

  Then, enable the catalog on your chosen R2 bucket:

  ```plaintext
  npx wrangler r2 bucket catalog enable r2-data-catalog-tutorial
  ```

  When you run this command, take note of the "Warehouse" and "Catalog URI". You will need these later.

* Dashboard

  1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.
  2. Select the bucket: r2-data-catalog-tutorial.
  3. Switch to the **Settings** tab, scroll down to **R2 Data Catalog**, and select **Enable**.
  4. Once enabled, note the **Catalog URI** and **Warehouse name**.

## 3. Create an API token

Iceberg clients (including [PyIceberg](https://py.iceberg.apache.org/)) must authenticate to the catalog with a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) that has both R2 and catalog permissions.

1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.

2. Expand the **API** dropdown and select **Manage API tokens**.

3. Select **Create API token**.

4. Select the **R2 Token** text to edit your API token name.

5. Under **Permissions**, choose the **Admin Read & Write** permission.

6. Select **Create API Token**.

7. Note the **Token value**.

## 4. Install uv

You need to install a Python package manager. In this guide, use [uv](https://docs.astral.sh/uv/). If you do not already have uv installed, follow the [installing uv guide](https://docs.astral.sh/uv/getting-started/installation/).

## 5. Install marimo and set up your project with uv

We will use [marimo](https://github.com/marimo-team/marimo) as a Python notebook.

1. Create a directory where our notebook will be stored:

   ```plaintext
   mkdir r2-data-catalog-notebook
   ```

2. Change into our new directory:

   ```plaintext
   cd r2-data-catalog-notebook
   ```

3. Initialize a new uv project (this creates a `.venv` and a `pyproject.toml`):

   ```plaintext
   uv init
   ```

4. Add marimo and required dependencies:

   ```py
   uv add marimo pyiceberg pyarrow pandas
   ```

## 6. Create a Python notebook to interact with the data warehouse

1. Create a file called `r2-data-catalog-tutorial.py`.

2. Paste the following code snippet into your `r2-data-catalog-tutorial.py` file:

   ```py
   import marimo


   __generated_with = "0.11.31"
   app = marimo.App(width="medium")




   @app.cell
   def _():
       import marimo as mo
       return (mo,)




   @app.cell
   def _():
       import pandas
       import pyarrow as pa
       import pyarrow.compute as pc
       import pyarrow.parquet as pq


       from pyiceberg.catalog.rest import RestCatalog


       # Define catalog connection details (replace variables)
       WAREHOUSE = "<WAREHOUSE>"
       TOKEN = "<TOKEN>"
       CATALOG_URI = "<CATALOG_URI>"


       # Connect to R2 Data Catalog
       catalog = RestCatalog(
           name="my_catalog",
           warehouse=WAREHOUSE,
           uri=CATALOG_URI,
           token=TOKEN,
       )
       return (
           CATALOG_URI,
           RestCatalog,
           TOKEN,
           WAREHOUSE,
           catalog,
           pa,
           pandas,
           pc,
           pq,
       )




   @app.cell
   def _(catalog):
       # Create default namespace if needed
       catalog.create_namespace_if_not_exists("default")
       return




   @app.cell
   def _(pa):
       # Create simple PyArrow table
       df = pa.table({
           "id": [1, 2, 3],
           "name": ["Alice", "Bob", "Charlie"],
           "score": [80.0, 92.5, 88.0],
       })
       return (df,)




   @app.cell
   def _(catalog, df):
       # Create or load Iceberg table
       test_table = ("default", "people")
       if not catalog.table_exists(test_table):
           print(f"Creating table: {test_table}")
           table = catalog.create_table(
               test_table,
               schema=df.schema,
           )
       else:
           table = catalog.load_table(test_table)
       return table, test_table




   @app.cell
   def _(df, table):
       # Append data
       table.append(df)
       return




   @app.cell
   def _(table):
       print("Table contents:")
       scanned = table.scan().to_arrow()
       print(scanned.to_pandas())
       return (scanned,)




   @app.cell
   def _():
       # Optional cleanup. To run uncomment and run cell
       # print(f"Deleting table: {test_table}")
       # catalog.drop_table(test_table)
       # print("Table dropped.")
       return




   if __name__ == "__main__":
       app.run()
   ```

3. Replace the `CATALOG_URI`, `WAREHOUSE`, and `TOKEN` variables with your values from sections **2** and **3** respectively.

4. Launch the notebook editor in your browser:

   ```plaintext
   uv run marimo edit r2-data-catalog-tutorial.py
   ```

   Once your notebook connects to the catalog, you'll see the catalog along with its namespaces and tables appear in marimo's Datasources panel.

In the Python notebook above, you:

1. Connect to your catalog.
2. Create the `default` namespace.
3. Create a simple PyArrow table.
4. Create (or load) the `people` table in the `default` namespace.
5. Append sample data to the table.
6. Print the contents of the table.
7. (Optional) Drop the `people` table we created for this tutorial.

## Learn more

[Managing catalogs ](https://developers.cloudflare.com/r2/data-catalog/manage-catalogs/)Enable or disable R2 Data Catalog on your bucket, retrieve configuration details, and authenticate your Iceberg engine.

[Connect to Iceberg engines ](https://developers.cloudflare.com/r2/data-catalog/config-examples/)Find detailed setup instructions for Apache Spark and other common query engines.


---
title: Getting started · Cloudflare R2 docs
description: Learn how to enable the R2 Data Catalog on your bucket, load sample
  data, and run your first query.
lastUpdated: 2025-06-06T13:35:32.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/r2/data-catalog/get-started/
  md: https://developers.cloudflare.com/r2/data-catalog/get-started/index.md
---

## Overview

This guide will instruct you through:

* Creating your first [R2 bucket](https://developers.cloudflare.com/r2/buckets/) and enabling its [data catalog](https://developers.cloudflare.com/r2/data-catalog/).
* Creating an [API token](https://developers.cloudflare.com/r2/api/tokens/) needed for query engines to authenticate with your data catalog.
* Using [PyIceberg](https://py.iceberg.apache.org/) to create your first Iceberg table in a [marimo](https://marimo.io/) Python notebook.
* Using [PyIceberg](https://py.iceberg.apache.org/) to load sample data into your table and query it.

## Prerequisites

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [`Node.js`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Node.js version manager

Use a Node version manager like [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

## 1. Create an R2 bucket

* Wrangler CLI

  1. If not already logged in, run:

     ```plaintext
     npx wrangler login
     ```

  2. Create an R2 bucket:

     ```plaintext
     npx wrangler r2 bucket create r2-data-catalog-tutorial
     ```

* Dashboard

  1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.
  2. Select **Create bucket**.
  3. Enter the bucket name: r2-data-catalog-tutorial
  4. Select **Create bucket**.

## 2. Enable the data catalog for your bucket

* Wrangler CLI

  Then, enable the catalog on your chosen R2 bucket:

  ```plaintext
  npx wrangler r2 bucket catalog enable r2-data-catalog-tutorial
  ```

  When you run this command, take note of the "Warehouse" and "Catalog URI". You will need these later.

* Dashboard

  1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.
  2. Select the bucket: r2-data-catalog-tutorial.
  3. Switch to the **Settings** tab, scroll down to **R2 Data Catalog**, and select **Enable**.
  4. Once enabled, note the **Catalog URI** and **Warehouse name**.

## 3. Create an API token

Iceberg clients (including [PyIceberg](https://py.iceberg.apache.org/)) must authenticate to the catalog with a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) that has both R2 and catalog permissions.

1. From the Cloudflare dashboard, select **R2 Object Storage** from the sidebar.

2. Expand the **API** dropdown and select **Manage API tokens**.

3. Select **Create API token**.

4. Select the **R2 Token** text to edit your API token name.

5. Under **Permissions**, choose the **Admin Read & Write** permission.

6. Select **Create API Token**.

7. Note the **Token value**.

## 4. Install uv

You need to install a Python package manager. In this guide, use [uv](https://docs.astral.sh/uv/). If you do not already have uv installed, follow the [installing uv guide](https://docs.astral.sh/uv/getting-started/installation/).

## 5. Install marimo and set up your project with uv

We will use [marimo](https://github.com/marimo-team/marimo) as a Python notebook.

1. Create a directory where our notebook will be stored:

   ```plaintext
   mkdir r2-data-catalog-notebook
   ```

2. Change into our new directory:

   ```plaintext
   cd r2-data-catalog-notebook
   ```

3. Initialize a new uv project (this creates a `.venv` and a `pyproject.toml`):

   ```plaintext
   uv init
   ```

4. Add marimo and required dependencies:

   ```py
   uv add marimo pyiceberg pyarrow pandas
   ```

## 6. Create a Python notebook to interact with the data warehouse

1. Create a file called `r2-data-catalog-tutorial.py`.

2. Paste the following code snippet into your `r2-data-catalog-tutorial.py` file:

   ```py
   import marimo


   __generated_with = "0.11.31"
   app = marimo.App(width="medium")




   @app.cell
   def _():
       import marimo as mo
       return (mo,)




   @app.cell
   def _():
       import pandas
       import pyarrow as pa
       import pyarrow.compute as pc
       import pyarrow.parquet as pq


       from pyiceberg.catalog.rest import RestCatalog


       # Define catalog connection details (replace variables)
       WAREHOUSE = "<WAREHOUSE>"
       TOKEN = "<TOKEN>"
       CATALOG_URI = "<CATALOG_URI>"


       # Connect to R2 Data Catalog
       catalog = RestCatalog(
           name="my_catalog",
           warehouse=WAREHOUSE,
           uri=CATALOG_URI,
           token=TOKEN,
       )
       return (
           CATALOG_URI,
           RestCatalog,
           TOKEN,
           WAREHOUSE,
           catalog,
           pa,
           pandas,
           pc,
           pq,
       )




   @app.cell
   def _(catalog):
       # Create default namespace if needed
       catalog.create_namespace_if_not_exists("default")
       return




   @app.cell
   def _(pa):
       # Create simple PyArrow table
       df = pa.table({
           "id": [1, 2, 3],
           "name": ["Alice", "Bob", "Charlie"],
           "score": [80.0, 92.5, 88.0],
       })
       return (df,)




   @app.cell
   def _(catalog, df):
       # Create or load Iceberg table
       test_table = ("default", "people")
       if not catalog.table_exists(test_table):
           print(f"Creating table: {test_table}")
           table = catalog.create_table(
               test_table,
               schema=df.schema,
           )
       else:
           table = catalog.load_table(test_table)
       return table, test_table




   @app.cell
   def _(df, table):
       # Append data
       table.append(df)
       return




   @app.cell
   def _(table):
       print("Table contents:")
       scanned = table.scan().to_arrow()
       print(scanned.to_pandas())
       return (scanned,)




   @app.cell
   def _():
       # Optional cleanup. To run uncomment and run cell
       # print(f"Deleting table: {test_table}")
       # catalog.drop_table(test_table)
       # print("Table dropped.")
       return




   if __name__ == "__main__":
       app.run()
   ```

3. Replace the `CATALOG_URI`, `WAREHOUSE`, and `TOKEN` variables with your values from sections **2** and **3** respectively.

4. Launch the notebook editor in your browser:

   ```plaintext
   uv run marimo edit r2-data-catalog-tutorial.py
   ```

   Once your notebook connects to the catalog, you'll see the catalog along with its namespaces and tables appear in marimo's Datasources panel.

In the Python notebook above, you:

1. Connect to your catalog.
2. Create the `default` namespace.
3. Create a simple PyArrow table.
4. Create (or load) the `people` table in the `default` namespace.
5. Append sample data to the table.
6. Print the contents of the table.
7. (Optional) Drop the `people` table we created for this tutorial.

## Learn more

[Managing catalogs ](https://developers.cloudflare.com/r2/data-catalog/manage-catalogs/)Enable or disable R2 Data Catalog on your bucket, retrieve configuration details, and authenticate your Iceberg engine.

[Connect to Iceberg engines ](https://developers.cloudflare.com/r2/data-catalog/config-examples/)Find detailed setup instructions for Apache Spark and other common query engines.
