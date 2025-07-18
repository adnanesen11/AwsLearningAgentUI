import boto3
import uuid
import os

# === Configuration ===
AGENT_ID = "BWLIU13QYP"
AGENT_ALIAS_ID = "CAX1BYK1MK"
REGION = "us-east-1"

# Optional: Uncomment if you want to hardcode credentials
# os.environ["AWS_ACCESS_KEY_ID"] = "..."
# os.environ["AWS_SECRET_ACCESS_KEY"] = "..."

session_id = str(uuid.uuid4())
user_message = "What topics are covered in the training videos?"

# Initialize the client
client = boto3.client("bedrock-agent-runtime", region_name=REGION)

try:
    response = client.invoke_agent(
        agentId=AGENT_ID,
        agentAliasId=AGENT_ALIAS_ID,
        sessionId=session_id,
        inputText=user_message  # ✅ this is the correct key!
    )
    
    print("✅ Agent responded successfully!")
    print("Full response:\n")
    print(response)

except client.exceptions.ResourceNotFoundException as e:
    print("❌ Agent or alias not found. Check AGENT_ID and AGENT_ALIAS_ID.")
    print(e)
except client.exceptions.AccessDeniedException as e:
    print("❌ Access denied. Check your IAM permissions.")
    print(e)
except client.exceptions.ValidationException as e:
    print("❌ Validation error. Check request format.")
    print(e)
except Exception as e:
    print("❌ Unexpected error:")
    print(e)
