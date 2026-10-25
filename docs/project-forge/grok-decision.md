# Adult-side Grok: disabled

Decision reviewed 25 October 2026. No Grok SDK, key input, public API endpoint, provider fetch or child-facing AI was added. Every instrument runs independently of it.

Primary sources checked:

- https://docs.x.ai/developers/models
- https://docs.x.ai/developers/faq/security
- https://docs.x.ai/developers/advanced-api-usage/regions
- https://x.ai/legal/acceptable-use-policy
- https://x.ai/legal/terms-of-service-enterprise

The API supports text/structured authoring; it could assist curriculum drafts and accessibility reviews. The provider documents default audit retention of prompts and responses for 30 days, with team-level ZDR controls and a response header to verify the setting. We have not verified this customer's team eligibility/settings, agreement, adult authentication, approved budget, regional requirements or human approval workflow.

The global endpoint does not guarantee processing location. The documented US regional endpoint supports selected text models and has a 10% token premium; this does not establish Australian residency. The public model listing did not expose fixed token-price values in the retrieved page, so a verified per-model cost quote and budget remain prerequisites; no price is invented here.

Future adult authoring must use a server-authenticated adult identity and an independent content repository, accept only authored curriculum/specification inputs, and have no access to child identity, genome, authored projects, reflection, classroom records, contacts, devices or publishing credentials. Outputs must be schema-validated drafts, with an explicit human review step before any child publication. Content approval must not be a client-side flag. Re-verify policies, model availability, pricing and retention before enabling the integration. Setting an environment key alone must never enable a child capability.

There is no verified adult-authenticated surface in this change; adding an unprotected API and calling it adult-only would not meet the requirement. Keeping it absent is the enforced disabled state.
