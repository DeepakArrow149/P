'use server';
/**
 * @fileOverview A Genkit flow to suggest contextual actions for production planning.
 *
 * - suggestPlanActions - A function that analyzes a planned order and suggests relevant actions.
 * - SuggestPlanActionsInput - The input type for the suggestPlanActions function.
 * - SuggestPlanActionsOutput - The return type for the suggestPlanActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPlanActionsInputSchema = z.object({
  taskId: z.string().describe('The unique identifier of the task/order block in the plan.'),
  orderId: z.string().describe('The original order identifier.'),
  styleName: z.string().describe('The name of the product style.'),
  quantity: z.number().describe('The total quantity of the order.'),
  currentStartDate: z.string().describe('The currently scheduled start date of the task (YYYY-MM-DD).'),
  currentEndDate: z.string().describe('The currently scheduled end date of the task (YYYY-MM-DD).'),
  requestedShipDate: z.string().describe('The customer-requested shipment date (YYYY-MM-DD).'),
  resourceId: z.string().describe('The ID of the resource/line this task is assigned to.'),
  resourceCapacityPerDay: z.number().optional().describe('The production capacity per day of the assigned resource.'),
  resourceCurrentLoadPercent: z.number().optional().describe('The estimated current load percentage of the resource during this task\'s period (0-100).'),
  materialStatus: z.enum(['available', 'shortage_critical', 'shortage_minor', 'pending_arrival', 'unknown']).optional().describe('The current status of materials required for this order.'),
  productionProgress: z.enum(['not_started', 'on_track', 'at_risk', 'delayed', 'completed', 'unknown']).optional().describe('The current production progress of this order.'),
  isNewStyle: z.boolean().optional().describe('Indicates if this is a new style, potentially requiring a learning curve.'),
  daysInProduction: z.number().describe('Number of days allocated for production for this task.'),
});
export type SuggestPlanActionsInput = z.infer<typeof SuggestPlanActionsInputSchema>;

const SuggestedActionSchema = z.object({
  actionLabel: z.string().describe('User-friendly label for the suggested action (e.g., "Split order due to high quantity").'),
  actionType: z.string().describe('A type/category for the action (e.g., "SPLIT_ORDER", "FLAG_LEARNING_CURVE", "PULL_ACTION").'),
  reasoning: z.string().optional().describe('Brief explanation for why this action is suggested.'),
  severity: z.enum(['info', 'warning', 'critical']).default('info').describe('Severity level of the suggestion.'),
});
export type SuggestedAction = z.infer<typeof SuggestedActionSchema>;

const SuggestPlanActionsOutputSchema = z.object({
  suggestions: z.array(SuggestedActionSchema).describe('An array of suggested actions.'),
});
export type SuggestPlanActionsOutput = z.infer<typeof SuggestPlanActionsOutputSchema>;

export async function suggestPlanActions(input: SuggestPlanActionsInput): Promise<SuggestPlanActionsOutput> {
  return suggestPlanActionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPlanActionsPrompt',
  input: {schema: SuggestPlanActionsInputSchema.extend({
    // Add formatted fields to the schema for the prompt itself, not for external input
    materialStatus_formatted: z.string(),
    productionProgress_formatted: z.string(),
    isNewStyle_formatted: z.string(),
  })},
  output: {schema: SuggestPlanActionsOutputSchema},
  prompt: `You are an expert production planning assistant for an apparel manufacturing company.
Given the details of a planned production order, analyze the situation and provide a list of relevant contextual actions or warnings.

Order Context:
- Task ID: {{taskId}}
- Order ID: {{orderId}}
- Style: {{styleName}}
- Quantity: {{quantity}}
- Scheduled Start: {{currentStartDate}}
- Scheduled End: {{currentEndDate}}
- Requested Ship Date: {{requestedShipDate}}
- Assigned Resource/Line: {{resourceId}}
- Days in Production: {{daysInProduction}}

Optional Context (may not always be provided):
- Resource Capacity/Day: {{#if resourceCapacityPerDay}}{{resourceCapacityPerDay}} units{{else}}N/A{{/if}}
- Resource Load % (during task): {{#if resourceCurrentLoadPercent}}{{resourceCurrentLoadPercent}}%{{else}}N/A{{/if}}
- Material Status: {{materialStatus_formatted}}
- Production Progress: {{productionProgress_formatted}}
- Is New Style: {{isNewStyle_formatted}}

Analyze the provided information and suggest actionable items. Consider the following scenarios and suggest actions with appropriate labels, types, reasoning, and severity:

1.  **Order Splitting**: If the quantity is very high (e.g., > 5000) AND the production duration ({{daysInProduction}} days) is long (e.g., > 10 days), suggest splitting the order.
    - actionLabel: "Split Order (High Quantity & Duration)"
    - actionType: "SPLIT_ORDER"
    - reasoning: "Order has a large quantity and long production time, consider splitting for better flow or risk mitigation."
    - severity: "warning"

2.  **Learning Curve**: If 'isNewStyle' is true (meaning {{isNewStyle_formatted}} is "Yes"), suggest flagging for learning curve adjustments.
    - actionLabel: "Flag Learning Curve (New Style)"
    - actionType: "FLAG_LEARNING_CURVE"
    - reasoning: "This is a new style, which may impact initial production speed. Account for learning curve."
    - severity: "info"

3.  **Delivery Pressure (Pull/Push)**:
    *   **Pull**: If 'currentEndDate' is significantly earlier (e.g., > 7 days) than 'requestedShipDate' AND 'productionProgress' is 'on_track' or 'unknown', suggest a "Pull Action".
        - actionLabel: "Consider Pull Action (Early Finish Potential)"
        - actionType: "PULL_ACTION"
        - reasoning: "Order is scheduled to finish well ahead of the requested ship date. Could be pulled if needed."
        - severity: "info"
    *   **Push**: If 'currentEndDate' is after 'requestedShipDate' OR 'productionProgress' is 'delayed' or 'at_risk', suggest a "Push Action" or "Expedite".
        - actionLabel: "Expedite / Push Action Needed (Risk of Delay)"
        - actionType: "PUSH_ACTION_REQUIRED"
        - reasoning: "Order is at risk of missing requested ship date due to schedule or progress. Needs attention."
        - severity: "critical"

4.  **Material Issues**:
    *   If 'materialStatus' is 'shortage_critical', suggest investigation.
        - actionLabel: "Investigate Critical Material Shortage"
        - actionType: "INVESTIGATE_MATERIAL_CRITICAL"
        - reasoning: "Critical material shortage reported. This will halt production. Immediate action required."
        - severity: "critical"
    *   If 'materialStatus' is 'shortage_minor', suggest monitoring.
        - actionLabel: "Monitor Minor Material Shortage"
        - actionType: "MONITOR_MATERIAL_MINOR"
        - reasoning: "Minor material shortage. Monitor closely to prevent production impact."
        - severity: "warning"

5.  **Resource Overload**: If 'resourceCurrentLoadPercent' is high (e.g., > 110%) and 'resourceCapacityPerDay' is provided, suggest rebalancing workload.
    - actionLabel: "Review Resource Load (Potential Overload)"
    - actionType: "REBALANCE_WORKLOAD"
    - reasoning: "Assigned resource may be overloaded. Review and consider rebalancing tasks."
    - severity: "warning"

6.  **Missed Start**: If 'currentStartDate' is in the past AND 'productionProgress' is 'not_started', flag it.
    - actionLabel: "Flag Order: Production Start Missed"
    - actionType: "FLAG_MISSED_START"
    - reasoning: "The scheduled start date for this order has passed, but production has not begun."
    - severity: "critical"

7.  **Short Duration for High Quantity**: If 'quantity' is high (e.g. > 3000) and 'daysInProduction' is very short (e.g. < 3 days) and 'resourceCapacityPerDay' is provided and (quantity / daysInProduction > resourceCapacityPerDay * 1.2) then this plan is unrealistic.
    - actionLabel: "Review Plan: Unrealistic Schedule (High Qty, Short Duration)"
    - actionType: "REVIEW_UNREALISTIC_SCHEDULE"
    - reasoning: "The planned quantity seems too high for the short production duration and resource capacity."
    - severity: "warning"

Output ONLY a JSON object matching the SuggestPlanActionsOutputSchema. Do not add any commentary before or after the JSON.
If no specific actions are strongly suggested, return an empty suggestions array.
`,
});

const suggestPlanActionsFlow = ai.defineFlow(
  {
    name: 'suggestPlanActionsFlow',
    inputSchema: SuggestPlanActionsInputSchema,
    outputSchema: SuggestPlanActionsOutputSchema,
  },
  async (input) => {
    // Pre-process input for handlebars
    let isNewStyleFormatted: string;
    if (input.isNewStyle === true) {
      isNewStyleFormatted = "Yes";
    } else if (input.isNewStyle === false) {
      isNewStyleFormatted = "No";
    } else {
      isNewStyleFormatted = "N/A";
    }

    const processedInput = {
        ...input,
        materialStatus_formatted: input.materialStatus || 'N/A',
        productionProgress_formatted: input.productionProgress || 'N/A',
        isNewStyle_formatted: isNewStyleFormatted,
        };

    // Cast to the prompt schema type that includes formatted fields
    const promptInput = processedInput as z.infer<typeof SuggestPlanActionsInputSchema> & {
        materialStatus_formatted: string;
        productionProgress_formatted: string;
        isNewStyle_formatted: string;
    };
    
    const {output} = await prompt(promptInput);
    
    // Ensure the output is always an object with a suggestions array, even if the LLM fails to produce perfect JSON.
    if (!output || !Array.isArray(output.suggestions)) {
      return { suggestions: [] };
    }
    return output;
  }
);

