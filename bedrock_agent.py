"""
CostWhisperer Backend Engine (AWS Bedrock Agent / Lambda Integration)
Demonstrates the programmatic Bedrock Runtime invocation using Anthropic Claude 3.5 Sonnet / Amazon Nova.
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

# Configuration
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

SYSTEM_PROMPT = """
You are CostWhisperer, an empathetic, delightful AWS cost optimization agent.
Your mission:
1. Translate cryptic AWS billing items (e.g., NatGateway-Bytes, VolumeUsage.gp2) into plain, intuitive English.
2. Calculate estimated cost recovery and identify silent budget leaks.
3. Modulate your tone according to the user's anxiety level (from calm optimization to emergency triage).
4. Provide copy-paste AWS CLI remediation commands that solve the root cause without sacrificing reliability.
Always respond with clarity, warmth, and actionable engineering steps.
"""

def get_bedrock_client():
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=AWS_REGION
    )

def analyze_bill_with_bedrock(bill_text: str, anxiety_level: int = 70):
    """
    Invokes Amazon Bedrock Claude 3.5 Sonnet to analyze raw AWS billing snippets.
    """
    client = get_bedrock_client()

    prompt = f"""
    The user is experiencing {anxiety_level}% bill anxiety.
    Here is their AWS billing / Cost Explorer text:
    ---
    {bill_text}
    ---

    Please provide:
    1. An empathetic greeting matching their anxiety level.
    2. Breakdown of the top cost leaks translated into plain English.
    3. Estimated monthly savings in USD.
    4. Exact AWS CLI remediation snippets for each issue.
    """

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1500,
        "temperature": 0.3,
        "system": SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}]
            }
        ]
    })

    try:
        response = client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body
        )
        response_body = json.loads(response.get("body").read())
        return response_body["content"][0]["text"]
    except ClientError as e:
        return f"Bedrock invocation error: {str(e)}"

def lambda_handler(event, context):
    """
    AWS Lambda entry point for API Gateway integration.
    """
    try:
        body = json.loads(event.get("body", "{}"))
        bill_text = body.get("billText", "")
        anxiety_level = body.get("anxietyLevel", 50)

        if not bill_text:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "billText is required"})
            }

        result = analyze_bill_with_bedrock(bill_text, anxiety_level)
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"analysis": result})
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(exc)})
        }
