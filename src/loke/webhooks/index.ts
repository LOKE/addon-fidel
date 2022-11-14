// import { Logger } from "@loke/logger";
// import { Router } from "express";

// import { EventDetails } from "../types/events";

// export class EventHandler {
//   constructor(private streakTracker: StreakTracker, private logger: Logger) {}

//   async handleEvent(event: EventDetails, organizationId: string) {
//     // TODO: consider implementing queuing
//     const orgId = organizationId || event.organization.id;
//     // const locationId = event.location.id;

//     if (!orgId) {
//       this.logger.warn(
//         "Expected organization ID on event " + JSON.stringify(event)
//       );
//       return;
//     }

//     switch (event.event) {
//       case "payment.completed":
//         await this.streakTracker.trackPayment(
//           orgId,
//           event.payment.customer.id,
//           new Date(event.payment.completedAt),
//           event.payment.chargedAmount,
//           event.payment.billingType
//         );
//         break;
//       default:
//         this.logger.warn("Unsupported webhook received: %j", event);
//     }
//   }

//   getRouter() {
//     const router = Router();

//     router.post("/:orgId", async (req, res) => {
//       try {
//         const orgId = req.params.orgId;
//         await this.handleEvent(req.body, orgId);
//         res.status(204).send();
//       } catch (err) {
//         // TODO: implement
//         res.status(500).send();
//       }
//     });

//     return router;
//   }
// }
