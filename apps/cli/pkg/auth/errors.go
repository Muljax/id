package auth

import (
	"fmt"
	"strings"
)

// RFC 6749 §4.1.2.1 and OpenID Connect Core 1.0 §3.1.2.6 Authorization Endpoint error codes
const (
	ErrCodeInvalidRequest         = "invalid_request"
	ErrCodeUnauthorizedClient     = "unauthorized_client"
	ErrCodeAccessDenied           = "access_denied"
	ErrCodeUnsupportedRespType    = "unsupported_response_type"
	ErrCodeInvalidScope           = "invalid_scope"
	ErrCodeServerError            = "server_error"
	ErrCodeTemporarilyUnavailable = "temporarily_unavailable"
	ErrCodeInteractionRequired    = "interaction_required"
	ErrCodeLoginRequired          = "login_required"
	ErrCodeAccountSelectionReq    = "account_selection_required"
	ErrCodeConsentRequired        = "consent_required"
	ErrCodeInvalidRequestURI      = "invalid_request_uri"
	ErrCodeInvalidRequestObject   = "invalid_request_object"
)

// RFC 6749 §5.2 and RFC 8628 §3.5 Token Endpoint error codes
const (
	ErrCodeInvalidClient        = "invalid_client"
	ErrCodeInvalidGrant         = "invalid_grant"
	ErrCodeUnsupportedGrantType = "unsupported_grant_type"
	ErrCodeAuthorizationPending = "authorization_pending"
	ErrCodeSlowDown             = "slow_down"
	ErrCodeExpiredToken         = "expired_token"
)

// OAuthError represents a structured error returned from an OAuth 2.0 / OIDC authorization
// or token endpoint per RFC 6749 §4.1.2.1, RFC 6749 §5.2, and OIDC Core 1.0 §3.1.2.6.
type OAuthError struct {
	Code        string `json:"error"`
	Description string `json:"error_description,omitempty"`
	URI         string `json:"error_uri,omitempty"`
	State       string `json:"state,omitempty"`
	StatusCode  int    `json:"-"`
}

func (e *OAuthError) Error() string {
	if e == nil {
		return ""
	}
	var b strings.Builder
	b.WriteString("oauth error (")
	b.WriteString(e.Code)
	b.WriteString(")")
	if e.Description != "" {
		b.WriteString(": ")
		b.WriteString(e.Description)
	}
	if e.StatusCode > 0 {
		b.WriteString(fmt.Sprintf(" [HTTP %d]", e.StatusCode))
	}
	return b.String()
}

// IsTemporarilyUnavailable indicates whether the error is due to server maintenance or lockdown (RFC 6749 §4.1.2.1).
func (e *OAuthError) IsTemporarilyUnavailable() bool {
	return e != nil && e.Code == ErrCodeTemporarilyUnavailable
}

// IsAccessDenied indicates whether access was rejected by policy or consent rejection (RFC 6749 §4.1.2.1).
func (e *OAuthError) IsAccessDenied() bool {
	return e != nil && e.Code == ErrCodeAccessDenied
}

// IsLoginRequired indicates whether interactive authentication or admin key is needed (OIDC Core 1.0 §3.1.2.6).
func (e *OAuthError) IsLoginRequired() bool {
	return e != nil && e.Code == ErrCodeLoginRequired
}

// IsInvalidGrant indicates whether the code or refresh token is expired, revoked, or blocked for non-admin (RFC 6749 §5.2).
func (e *OAuthError) IsInvalidGrant() bool {
	return e != nil && e.Code == ErrCodeInvalidGrant
}

// IsAuthorizationPending indicates whether the user has not yet approved the device code (RFC 8628 §3.5).
func (e *OAuthError) IsAuthorizationPending() bool {
	return e != nil && e.Code == ErrCodeAuthorizationPending
}

// IsSlowDown indicates whether the client is polling faster than the allowed interval (RFC 8628 §3.5).
func (e *OAuthError) IsSlowDown() bool {
	return e != nil && e.Code == ErrCodeSlowDown
}

// IsExpiredToken indicates whether the device code has expired before user approval (RFC 8628 §3.5).
func (e *OAuthError) IsExpiredToken() bool {
	return e != nil && e.Code == ErrCodeExpiredToken
}

// FriendlyMessage returns a clean, human-readable description for end-user terminal display.
func (e *OAuthError) FriendlyMessage() string {
	if e == nil {
		return ""
	}

	switch e.Code {
	case ErrCodeAuthorizationPending:
		return "Device authorization is pending user confirmation"

	case ErrCodeSlowDown:
		return "Polling rate limit exceeded; polling interval has been increased"

	case ErrCodeExpiredToken:
		return "Device activation code has expired; please run 'muljax id auth login' to generate a new code"

	case ErrCodeTemporarilyUnavailable:
		if e.Description != "" {
			return fmt.Sprintf("Instance unavailable or undergoing maintenance (%s)", e.Description)
		}
		return "Authorization server is temporarily unavailable or undergoing maintenance/lockdown"

	case ErrCodeAccessDenied:
		if e.Description != "" {
			return fmt.Sprintf("Access denied by policy (%s)", e.Description)
		}
		return "Access denied: the authorization server or user rejected the request"

	case ErrCodeLoginRequired:
		if e.Description != "" {
			return fmt.Sprintf("Interactive authentication required (%s)", e.Description)
		}
		return "Interactive login or administrator key required"

	case ErrCodeInvalidGrant:
		if e.Description != "" {
			return fmt.Sprintf("Invalid or restricted grant (%s)", e.Description)
		}
		return "Authorization grant, device code, or refresh token is invalid, expired, revoked, or restricted during lockdown"

	case ErrCodeInteractionRequired:
		return "User interaction is required to complete authentication"

	case ErrCodeConsentRequired:
		return "User or administrative consent is required to proceed"

	case ErrCodeUnauthorizedClient:
		return "Client application is not authorized to request this authorization grant"

	case ErrCodeInvalidClient:
		return "Client authentication failed with the authorization server"

	case ErrCodeInvalidScope:
		return "Requested OAuth scope is invalid, unauthorized, or malformed"

	case ErrCodeServerError:
		if e.Description != "" {
			return fmt.Sprintf("Authorization server error: %s", e.Description)
		}
		return "Authorization server encountered an internal error (server_error)"

	default:
		if e.Description != "" {
			return fmt.Sprintf("%s: %s", e.Code, e.Description)
		}
		return e.Code
	}
}
