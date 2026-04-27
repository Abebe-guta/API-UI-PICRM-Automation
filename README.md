# API-UI-Automation-PICRM
Test through API  and UI
"# API-UI-PICRM-Automation" 

API (truth) → Domain (rules) → Strategies (decisions) → Service (orchestration) → Tests (validation)

1. api/ — “HOW WE TALK TO BACKEND”
Purpose:

This folder is your communication layer with backend APIs.

You NEVER put business logic here.

What each file does:
🔹 base.api.js
Common HTTP wrapper (fetch/axios)
Handles:
base URL
headers
auth token injection
retry / error handling

👉 Think: “one API client for everything”

🔹 auth.api.js
Login / logout / token refresh
Example:
login(username, password)
getUser()
🔹 segment.api.js
All segment-related backend calls:
create segment
preview segment
fetch segment list
delete segment

👉 This is your main business API interface

🔹 columns.api.js
Fetch dynamic schema from banks

Example:

get tables
get columns for table
get metadata (type_category)

👉 This is CRITICAL because banks change schema

🧠 2. domain/ — “RULES OF YOUR SYSTEM (CORE INTELLIGENCE)”
Purpose:

This is where you define:

“What is a valid segment?”

NOT how to call API, not UI — only logic rules

🔹 segment.model.js

Defines structure of a segment:

{
  attributes: [],
  metrics: [],
  filters: []
}

👉 Ensures everything always follows one format

🔹 schema/

This is your anti-breakage layer for bank schema changes

🔸 schema.normalizer.js

Problem:
Banks may return:

name / column_name / field_name
type_category / dataType / type

Solution:
This file converts EVERYTHING into a standard format:

{
  name: "age",
  type: "numeric | categorical | date"
}

👉 This prevents 80% of test failures

🔸 schema.resolver.js

This decides:

which columns are usable
which are safe
which are broken/ignored

Example:

remove null columns
fix missing type_category
filter unsupported types

👉 Think: “cleaning + validating schema”

⚙️ 3. services/ — “ORCHESTRATION ENGINE (BRAIN CONTROLLER)”
🔹 segmentBuilder.service.js

This is your main engine

It:

Fetches columns from API
Sends them to schema resolver
Passes clean schema to strategies
Builds final segment model
Sends request to segment API
In simple terms:
API → Clean → Decide → Build → Execute

👉 This is where full test logic is controlled

🧩 4. strategies/ — “DECISION MAKERS”
Purpose:

This is where randomness + business logic happens.

But controlled randomness (NOT chaos).

🔹 attributeStrategy.js

Decides:

which columns to pick
how many attributes
mix of numeric + categorical

Example:

pick 2 numeric
pick 2 categorical
🔹 binStrategy.js

Handles numeric vs categorical logic

Numeric:
bin ranges (0–30, 30–60, etc.)
quantile simulation
Categorical:
selection of values (MALE/FEMALE etc.)
🔹 metricStrategy.js

Decides aggregation:

numeric → SUM / AVG / MIN / MAX
categorical → COUNT only

👉 Prevents invalid metric combinations

🖥 5. pages/ — “UI REPRESENTATION (POM)”
Purpose:

This is Page Object Model (POM) for Playwright.

You isolate UI interactions here.

Example responsibilities:
🔹 LoginPage.js
login actions
validation
🔹 CreateSegmentPage.js
click create segment
select table
🔹 AttributeSelectionPage.js
select columns
filter attributes
🔹 ConfigureAttributePage.js
configure bins / categories
🔹 SelectMetricsPage.js
select metrics
🔹 PreviewSavePage.js
validate preview
save segment

👉 This ensures:

UI logic is NOT inside tests
tests stay clean and readable
🧪 6. tests/ — “WHAT WE VERIFY”
Purpose:

This is where validation happens.

You split tests into 3 levels:

🔵 api/ — contract validation
check API response structure
ensure schema is valid
ensure segment API works

👉 fast, stable tests

🟡 ui/ — smoke tests
login works
navigation works
buttons work

👉 NO business logic here

🔴 hybrid/ — MOST IMPORTANT

This is your real system test

It:

uses API + domain logic
drives UI
validates backend result

👉 This is your confidence layer

🧰 7. utils/ — “HELPERS & SUPPORT TOOLS”
Purpose:

Reusable generic tools

🔹 testData.js
mock inputs
fallback data
default configs
🔹 helpers.js
random pick
formatting
wait utilities
data transformers

👉 No business logic here

🧪 8. fixtures/ — “TEST SETUP INJECTION”
Purpose:

Standardize test environment setup

🔹 base.fixture.js

Handles:

login state
API context
test data injection
shared setup between tests

👉 Think:

“every test starts from same controlled environment”

🚀 FINAL MENTAL MODEL

Here is how everything works together:

BANK API
   ↓
columns.api.js
   ↓
schema.normalizer.js
   ↓
schema.resolver.js
   ↓
strategies/
   ↓
segmentBuilder.service.js
   ↓
segment.api.js
   ↓
UI (pages/)
   ↓
tests/ validation

////GAP in API Schema///
API schema locking (VERY IMPORTANT)

Add:

api/
   contracts/
      segment.contract.js
      columns.contract.js
Purpose:
Validate API response structure
Detect breaking changes early