import enum


class UserRole(str, enum.Enum):
    USER = "user"
    SUPERUSER = "superuser"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    BLOCKED = "blocked"
    DELETED = "deleted"


class MessageSenderType(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AuditActionType(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    APPROVE = "approve"
    BLOCK = "block"
    CHANGE_ROLE = "change_role"

def enum_values(enum_class: type[enum.Enum]) -> list[str]:
    return [item.value for item in enum_class]