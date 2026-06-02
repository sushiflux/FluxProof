namespace FluxProof.Domain.Enums;

public enum ActivityAction
{
    UserLogin = 1,
    UserLogout = 2,
    UserLoginFailed = 3,
    UserCreated = 4,
    UserUpdated = 5,
    UserDeleted = 6,
    RoleCreated = 7,
    RoleUpdated = 8,
    RoleDeleted = 9,
    ProjectCreated = 10,
    ProjectUpdated = 11,
    RevisionCreated = 12,
    RevisionReplaced = 13,
    RevisionItemMarkedDeleted = 14,
    PermissionChanged = 15,
    SettingsChanged = 16
}
