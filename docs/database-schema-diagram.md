# Walletwise Database Schema Diagram

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has"
    PROFILES ||--o{ ADMIN_CONFIG : "configures"
    PROFILES ||--o{ ACCOUNTS : "owns"
    PROFILES ||--o{ CATEGORIES : "creates"
    PROFILES ||--o{ TRANSACTIONS : "makes"
    PROFILES ||--o{ RECURRING_EXPENSES : "schedules"
    PROFILES ||--o{ CFO_CONVERSATIONS : "chats"
    PROFILES ||--o{ BUDGETS : "plans"

    ACCOUNTS ||--o{ TRANSACTIONS : "contains"
    ACCOUNTS ||--o{ RECURRING_EXPENSES : "debits"

    CATEGORIES ||--o{ TRANSACTIONS : "categorizes"
    CATEGORIES ||--o{ RECURRING_EXPENSES : "categorizes"
    CATEGORIES ||--o{ BUDGETS : "tracks"
    CATEGORIES ||--o{ CATEGORIES : "parent_of"

    RECURRING_EXPENSES ||--o{ TRANSACTIONS : "generates"

    AUTH_USERS {
        uuid id PK
        string email
        string encrypted_password
        timestamp created_at
    }

    PROFILES {
        uuid id PK "FK to auth.users"
        string email
        string full_name
        string avatar_url
        string timezone
        string currency_code
        timestamp created_at
        timestamp updated_at
    }

    ADMIN_CONFIG {
        uuid id PK
        uuid user_id FK
        string config_key
        jsonb config_value
        boolean is_encrypted
        timestamp created_at
        timestamp updated_at
    }

    ACCOUNTS {
        uuid id PK
        uuid user_id FK
        string name
        enum type "checking,savings,credit_card,cash,investment,other"
        decimal balance
        string currency_code
        string icon
        string color
        boolean is_active
        string notes
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        uuid user_id FK
        string name
        enum type "income,expense"
        string icon
        string color
        uuid parent_id FK "self-reference"
        boolean is_default
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        uuid category_id FK
        enum type "income,expense"
        decimal amount
        string currency_code
        string description
        string notes
        timestamp transaction_date
        boolean is_recurring
        uuid recurring_expense_id
        array tags
        timestamp created_at
        timestamp updated_at
    }

    RECURRING_EXPENSES {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        uuid category_id FK
        string name
        decimal amount
        string currency_code
        enum frequency "daily,weekly,biweekly,monthly,quarterly,semiannual,annual"
        date start_date
        date end_date
        date next_due_date
        boolean is_active
        boolean auto_create
        string notes
        timestamp created_at
        timestamp updated_at
    }

    CFO_CONVERSATIONS {
        uuid id PK
        uuid user_id FK
        string session_id
        enum role "user,assistant,system"
        string content
        jsonb metadata
        timestamp created_at
    }

    BUDGETS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        string name
        decimal amount
        string currency_code
        enum period "daily,weekly,monthly,quarterly,annual"
        date start_date
        date end_date
        decimal alert_threshold
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
```

## Database Flow Diagram

```mermaid
flowchart TB
    subgraph AUTH["Authentication Layer"]
        A1[auth.users]
    end

    subgraph USER["User Layer"]
        U1[profiles]
        U2[admin_config]
    end

    subgraph FINANCE["Financial Management"]
        F1[accounts]
        F2[categories]
        F3[transactions]
        F4[recurring_expenses]
        F5[budgets]
    end

    subgraph AI["AI Agent Layer"]
        AI1[cfo_conversations]
    end

    A1 -->|"trigger: on signup"| U1
    U1 --> U2
    U1 --> F1
    U1 --> F2
    U1 --> F3
    U1 --> F4
    U1 --> F5
    U1 --> AI1

    F1 -->|"trigger: update balance"| F3
    F2 --> F3
    F2 --> F4
    F2 --> F5
    F4 -->|"auto-generate"| F3

    style AUTH fill:#e1f5ff
    style USER fill:#fff3e0
    style FINANCE fill:#e8f5e9
    style AI fill:#f3e5f5
```

## Data Flow: Transaction Creation

```mermaid
sequenceDiagram
    participant U as User
    participant APP as Application
    participant DB as Database
    participant TRG as Trigger
    participant ACC as Accounts Table

    U->>APP: Create Transaction
    APP->>DB: INSERT INTO transactions
    DB->>TRG: Fire: transaction_update_account_balance

    alt Transaction Type = expense
        TRG->>ACC: balance = balance - amount
    else Transaction Type = income
        TRG->>ACC: balance = balance + amount
    end

    ACC->>DB: Return updated balance
    DB->>APP: Return transaction + updated balance
    APP->>U: Show confirmation
```

## RLS Policy Flow

```mermaid
flowchart LR
    subgraph CLIENT["Client Request"]
        C1[User Query]
    end

    subgraph AUTH_CHECK["Authentication Check"]
        A1{Authenticated?}
        A2[Get auth.uid]
    end

    subgraph RLS["Row Level Security"]
        R1{user_id = auth.uid?}
    end

    subgraph RESULT["Query Result"]
        S1[Return Data]
        E1[Return Empty/Error]
    end

    C1 --> A1
    A1 -->|Yes| A2
    A1 -->|No| E1
    A2 --> R1
    R1 -->|Yes| S1
    R1 -->|No| E1

    style AUTH_CHECK fill:#fff3e0
    style RLS fill:#e8f5e9
    style RESULT fill:#e1f5ff
```

## Recurring Expense Processing

```mermaid
flowchart TB
    START([Cron Job Triggered]) --> CHECK{Check next_due_date}
    CHECK -->|due <= today| PROCESS[Process Recurring Expense]
    CHECK -->|due > today| SKIP[Skip]

    PROCESS --> CREATE[Create Transaction]
    CREATE --> UPDATE[Update next_due_date]
    UPDATE --> CALC{Calculate Next Date}

    CALC -->|daily| ADD1[+1 day]
    CALC -->|weekly| ADD2[+1 week]
    CALC -->|biweekly| ADD3[+2 weeks]
    CALC -->|monthly| ADD4[+1 month]
    CALC -->|quarterly| ADD5[+3 months]
    CALC -->|semiannual| ADD6[+6 months]
    CALC -->|annual| ADD7[+1 year]

    ADD1 --> SAVE[Save new next_due_date]
    ADD2 --> SAVE
    ADD3 --> SAVE
    ADD4 --> SAVE
    ADD5 --> SAVE
    ADD6 --> SAVE
    ADD7 --> SAVE

    SAVE --> NEXT{More recurring?}
    SKIP --> NEXT
    NEXT -->|Yes| CHECK
    NEXT -->|No| END([Done])

    style START fill:#e8f5e9
    style PROCESS fill:#fff3e0
    style END fill:#e1f5ff
```

## Budget Progress Calculation

```mermaid
flowchart LR
    subgraph INPUT["Input"]
        I1[budget_id]
    end

    subgraph FETCH["Fetch Data"]
        F1[Get Budget Details]
        F2[Sum Transactions in Period]
    end

    subgraph CALC["Calculate"]
        C1[spent_amount = SUM]
        C2[remaining = budget - spent]
        C3[percentage = spent / budget * 100]
        C4{percentage > 100?}
    end

    subgraph OUTPUT["Output"]
        O1[Budget Progress Report]
    end

    I1 --> F1
    I1 --> F2
    F1 --> C1
    F2 --> C1
    C1 --> C2
    C1 --> C3
    C3 --> C4
    C4 -->|Yes| O1
    C4 -->|No| O1

    style INPUT fill:#e1f5ff
    style CALC fill:#fff3e0
    style OUTPUT fill:#e8f5e9
```

## Index Strategy

```mermaid
mindmap
  root((Database Indexes))
    User Lookups
      profiles.email
      profiles.id
    Accounts
      accounts.user_id
      accounts.user_id + is_active
    Transactions
      transactions.user_id
      transactions.account_id
      transactions.category_id
      transactions.transaction_date DESC
      transactions.user_id + transaction_date
      transactions.recurring_expense_id
    Categories
      categories.user_id
      categories.user_id + type
      categories.parent_id
    Recurring
      recurring_expenses.user_id
      recurring_expenses.is_active
      recurring_expenses.next_due_date
    Conversations
      cfo_conversations.user_id
      cfo_conversations.session_id
      cfo_conversations.user_id + session_id
    Budgets
      budgets.user_id
      budgets.category_id
      budgets.is_active
```

## Security Layers

```mermaid
flowchart TB
    subgraph L1["Layer 1: Network"]
        N1[HTTPS Only]
        N2[Supabase Auth]
    end

    subgraph L2["Layer 2: Authentication"]
        A1[JWT Tokens]
        A2[Session Management]
    end

    subgraph L3["Layer 3: Row Level Security"]
        R1[RLS Policies]
        R2[auth.uid Check]
    end

    subgraph L4["Layer 4: Constraints"]
        C1[Foreign Keys]
        C2[Check Constraints]
        C3[NOT NULL Constraints]
    end

    subgraph L5["Layer 5: Application"]
        P1[Input Validation]
        P2[Business Logic]
    end

    N1 --> A1
    N2 --> A1
    A1 --> R1
    A2 --> R2
    R1 --> C1
    R2 --> C1
    C1 --> P1
    C2 --> P1
    C3 --> P2

    style L1 fill:#ffebee
    style L2 fill:#fff3e0
    style L3 fill:#e8f5e9
    style L4 fill:#e1f5ff
    style L5 fill:#f3e5f5
```

## Function Dependencies

```mermaid
graph TD
    subgraph TRIGGERS["Triggers (Auto-Execute)"]
        T1[create_profile_for_user]
        T2[update_account_balance_on_transaction]
        T3[update_updated_at_column]
    end

    subgraph UTILITY["Utility Functions"]
        U1[calculate_next_due_date]
        U2[get_account_balance]
        U3[get_user_total_balance]
    end

    subgraph BUSINESS["Business Logic"]
        B1[seed_default_categories]
        B2[get_monthly_spending_by_category]
        B3[get_budget_progress]
        B4[process_due_recurring_expenses]
    end

    AUTH[auth.users INSERT] --> T1
    TRANS[transactions INSERT/UPDATE/DELETE] --> T2
    ANY[Any table UPDATE] --> T3

    B4 --> U1
    B3 --> U2

    style TRIGGERS fill:#e8f5e9
    style UTILITY fill:#fff3e0
    style BUSINESS fill:#e1f5ff
```

## Category Hierarchy Example

```mermaid
graph TD
    ROOT[User Categories]

    ROOT --> EXP[Expense Categories]
    ROOT --> INC[Income Categories]

    EXP --> FOOD[Food & Dining]
    EXP --> TRANS[Transportation]
    EXP --> SHOP[Shopping]
    EXP --> ENT[Entertainment]

    FOOD --> REST[Restaurants]
    FOOD --> GROC[Groceries]
    FOOD --> CAFE[Coffee Shops]

    SHOP --> CLOTH[Clothing]
    SHOP --> ELEC[Electronics]
    SHOP --> HOME[Home & Garden]

    INC --> SAL[Salary]
    INC --> FREE[Freelance]
    INC --> INV[Investment]

    style ROOT fill:#f3e5f5
    style EXP fill:#ffebee
    style INC fill:#e8f5e9
```

## Transaction Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: User creates transaction
    Created --> Validated: Check constraints pass
    Validated --> RLS_Check: RLS policies verified
    RLS_Check --> Saved: INSERT to database
    Saved --> Trigger_Fired: Trigger executes
    Trigger_Fired --> Balance_Updated: Account balance updated
    Balance_Updated --> Confirmed: Return to user
    Confirmed --> [*]

    RLS_Check --> Error: RLS violation
    Validated --> Error: Constraint violation
    Error --> [*]
```

---

## Legend

### Relationship Symbols
- `||--||` : One to One
- `||--o{` : One to Many
- `o{--o{` : Many to Many

### Diagram Types
- **ERD**: Entity Relationship Diagram (structure)
- **Flowchart**: Process flow (logic)
- **Sequence**: Interaction over time
- **Mindmap**: Hierarchical overview
- **State**: Lifecycle states

### Color Coding
- 🔵 **Blue** (#e1f5ff): Authentication/Authorization
- 🟡 **Yellow** (#fff3e0): User/Profile
- 🟢 **Green** (#e8f5e9): Financial/Core
- 🟣 **Purple** (#f3e5f5): AI/Advanced
- 🔴 **Red** (#ffebee): Security/Critical

---

## How to Use These Diagrams

### In Development
- Reference ERD when creating new features
- Follow flow diagrams for business logic
- Check security layers before implementing endpoints

### In Documentation
- Include in technical specs
- Use in onboarding new developers
- Reference in architecture reviews

### In Debugging
- Trace data flow through diagrams
- Verify RLS policy logic
- Check trigger execution order

---

**Note:** These diagrams are generated using Mermaid.js and can be rendered in:
- GitHub README files
- Markdown editors (VS Code, Obsidian, etc.)
- Documentation sites (Docusaurus, VitePress, etc.)
- Mermaid Live Editor (https://mermaid.live)
