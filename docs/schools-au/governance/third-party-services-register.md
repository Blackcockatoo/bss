# MetaPet Schools Third-Party Services Register

## Current school deployment position

The school-facing deployment is designed to avoid routine third-party tracking, adtech, and social features.

| Service type | Current school deployment position | Notes |
| --- | --- | --- |
| Hosting platform | Depends on the school deployment environment | List the actual host before rollout |
| Browser local storage | Used | Stores local classroom records on the device |
| Analytics SDK | Not required for the school deployment | No hidden analytics in the school runtime |
| Ad network | Not used | Child-facing advertising is out of scope |
| Social login | Not used | Student accounts are not required |

## Review rule

Do not claim `no third parties` unless the actual deployment environment and infrastructure logs have been checked end-to-end.
