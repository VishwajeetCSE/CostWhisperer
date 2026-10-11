# CostWhisperer: An AWS Bill Translator & Cost Leak Agent People Actually Enjoy Using

**Article Tag**: `#agents`  
**Author**: Vishwajeet  
**Live Demo**: [https://vishwajeetcse.github.io/CostWhisperer/](https://vishwajeetcse.github.io/CostWhisperer/)  
**GitHub Repository**: [https://github.com/VishwajeetCSE/CostWhisperer](https://github.com/VishwajeetCSE/CostWhisperer)  

---

## 1. What and Who

### Who is this for?
Every developer, indie hacker, startup CTO, and cloud engineer who has ever experienced the cold sweat of opening the AWS Billing console at the end of the month. 

Whether you are running a two-person SaaS or a microservices fleet on Amazon ECS/EKS, AWS bills are notoriously opaque. Line items like `NatGateway-Bytes`, `DataTransfer-Regional-Bytes`, or `VolumeUsage.gp2` don't tell you *what you built wrong*—they just tell you what you owe. Traditional cost management tools only make things worse by dumping massive CSV spreadsheets and multi-layered charts that induce guilt without delivering immediate relief.

### What does CostWhisperer do?
**CostWhisperer** is an empathetic, conversational AI agent that turns cryptic AWS invoices into clear, human-understandable explanations and instant actionable fixes. 

Instead of showing complicated cost curves, CostWhisperer:
1. **Translates billing SKUs into plain English**: It explains *why* AWS charged you (e.g., *"You are paying a $0.045/GB toll tax because your private containers are pulling Docker images and S3 assets through a NAT Gateway instead of a free VPC endpoint"*).
2. **Quantifies silent leaks**: It pinpoints unattached EBS storage, idle Elastic IPs, cross-AZ traffic penalties, and forgotten CloudWatch log streams.
3. **Generates copy-paste AWS CLI remediation scripts**: It gives you the exact shell command to delete or reconfigure the culprit in seconds.
4. **Calculates monthly dollar recovery**: Shows you how much capital you are freeing up back into your runway.

---

## 2. How I Built It

CostWhisperer is designed around speed, reliability, and accessibility. The architecture combines generative intelligence with a dedicated cloud cost heuristics engine.

```
       [User / Cloud Builder]
                  │
        (Web UI / Mobile-Friendly)
                  │
    ┌─────────────┴──────────────┐
    ▼                            ▼
[Tone & Anxiety Modulator]   [Real-time Jargon Decoder]
    │                            │
    └─────────────┬──────────────┘
                  ▼
         [AWS Bedrock Runtime]
      (Claude 3.5 Sonnet / Amazon Nova)
                  │
                  ▼
  [Actionable Remediation & CLI Generator]
                  │
                  ▼
      [Confetti & Savings Counter]
```

### AWS Services & Tools Used:
1. **Amazon Bedrock (Anthropic Claude 3.5 Sonnet & Amazon Nova)**: Powers the conversational agent reasoning. We utilize Bedrock's foundation models via the `boto3` Bedrock Runtime client to parse raw unstructured invoice text, detect nuances in AWS service usage, and output structured remediation advice.
2. **AWS Lambda & Amazon API Gateway**: A serverless Python backend (`bedrock_agent.py`) that receives bill queries, applies system prompt guardrails, and interfaces securely with Amazon Bedrock using IAM execution roles without exposing credentials to the client.
3. **AWS CLI & CloudFormation / Terraform Snippets**: Pre-validated infrastructure commands tailored to safely remedy top cost drains (like deploying free Amazon S3 Gateway Endpoints or cleaning unassociated Elastic IPs).
4. **Client Experience Layer**: A responsive vanilla web application with zero heavy build steps, making it instant to load, fully responsive on mobile, and deployable via GitHub Pages or AWS Amplify.

### The System Prompt Guardrails
To ensure the agent behaves like a supportive, experienced cloud mentor rather than a robotic script, we crafted a prompt that explicitly conditions tone on the user's stress level:
```python
SYSTEM_PROMPT = """
You are CostWhisperer, an empathetic, delightful AWS cost optimization agent.
Your mission:
1. Translate cryptic AWS billing items into plain, intuitive English.
2. Modulate your tone according to the user's anxiety level (from calm optimization to emergency triage).
3. Provide copy-paste AWS CLI remediation commands that solve the root cause without sacrificing reliability.
Always respond with clarity, warmth, and actionable engineering steps.
"""
```

---

## 3. The Delightful Detail

The theme of this challenge is: **"Build an agent people actually enjoy using. Small and delightful beats big and clunky."**

Most cloud financial tools feel like an audit. We wanted CostWhisperer to feel like a high-five from a teammate who has your back.

### The "AWS Bill Anxiety Meter" 😰 ➡️ 😌
The standout delightful detail in CostWhisperer is the interactive **Anxiety Meter**:
- When you set your anxiety to **100% ("Boss Saw The Bill / Emergency Mode")**, the agent immediately cuts all unnecessary pleasantries, puts on an emergency triage persona, and highlights the biggest leak first so you can stop the bleeding in under 60 seconds.
- When set to **"Zen Mode"**, the agent takes a relaxed, educational tone, explaining the architectural nuances of AWS networking and VPC pricing models.

### Micro-Delights that Make it Enjoyable:
- **Instant "Try a Scenario" buttons**: You don't even need an active AWS invoice to experience it. Users can test real-world scenarios like *"The Startup Surprise ($1,420/mo NAT leak)"* or *"The Dormant Dev Playground"* with a single click.
- **One-Click Copyable CLI Buttons with visual state**: Clicking "Copy AWS CLI" swaps the button to a green checkmark with immediate clipboard confirmation.
- **The Confetti Savings Counter**: Whenever CostWhisperer identifies recoverable funds, a dynamic savings banner tallies up the dollars saved and launches a confetti celebration 🎉. Developers work hard; reclaiming $500/month should feel like winning a trophy.

### How do I know it worked?
During user testing with fellow developers, their first reaction wasn't "let me see the charts"—it was laughter and relief when they dragged the Anxiety slider, followed by: *"Wait, can I really just run that one VPC endpoint command to stop paying $800 on NAT gateway data processing?"* It replaced confusion with empowerment.

---

## 4. Proof It Works

- **Live Web Application**: [https://vishwajeetcse.github.io/CostWhisperer/](https://vishwajeetcse.github.io/CostWhisperer/)
- **Source Code**: [https://github.com/VishwajeetCSE/CostWhisperer](https://github.com/VishwajeetCSE/CostWhisperer)

### Example Run: The $1,420/Month Startup Surprise
When presented with an invoice snippet containing:
```
- Amazon Elastic Compute Cloud - NatGateway-Bytes: $842.10
- Amazon Elastic Block Store - VolumeUsage.gp2: $148.00
- AmazonCloudWatch - PutLogEvents: $152.40
```

CostWhisperer immediately:
1. Deconstructs the NAT Gateway toll tax and provides the zero-cost S3 Gateway Endpoint CLI command.
2. Identifies unattached `gp2` storage and outputs the single-line volume deletion command.
3. Flags CloudWatch log groups with missing retention limits and provides the command to set them to 14 days.
4. Celebrates with **$1,142.00 / mo in potential monthly savings**.

---

## 5. Conclusion & What's Next

Building an AI agent people enjoy using isn't about packing in 50 complex features. It's about taking a stressful, painful moment—like an unexpectedly high AWS bill—and turning it into an enjoyable, productive, and reassuring experience. 

With Amazon Bedrock, we can build agents that don't just compute numbers, but understand developer emotion and solve real engineering pain points with empathy.

Give [CostWhisperer](https://vishwajeetcse.github.io/CostWhisperer/) a spin, run the CLI fixes, and reclaim your AWS budget! 🚀
