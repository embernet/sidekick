# Entity Relationship Diagram   
```mermaid
erDiagram
    users ||--o{ folders : has
    users ||--o{ documents : has
    folders ||--o{ documents : contains
    documents }o--|| relationships : has-from
    documents }o--|| relationships : has-to
    users {
        text id PK
        text properties
        text password_hash
    }
    folders {
        integer id PK
        text user_id FK >- users.id
        text name
        text properties
    }
    documents {
        text id PK
        text user_id FK >- users.id
        integer folder_id FK >- folders.id
        text name
        text created_date
        text updated_date
        text tags
        text properties
        text content
    }
    relationships {
        text id PK
        text user_id FK >- users.id
        text tags
        text from_document_id FK >- documents.id
        text name
        text to_document_id FK >- documents.id
        text properties
    }
```
