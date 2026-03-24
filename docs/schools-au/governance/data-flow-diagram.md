# MetaPet Schools Data Flow Diagram

## Default classroom flow

```mermaid
flowchart LR
  T["Teacher"] --> D["School Device"]
  S["Student alias"] --> D
  L["Lesson setup"] --> D
  P["Progress states"] --> D
  A["Local class summary"] --> D
  D --> X["Optional teacher export"]
```

## Notes

- Default classroom use stays on the current device.
- The teacher controls setup, lesson timing, and any export.
- Export is optional and should be reviewed before leaving the device.
- Adult-only and experimental routes sit outside this school flow.
