from typing import List, Dict, Generator
from groq import Groq, GroqError
from app.config import settings

# Initialize the client
client = Groq(api_key=settings.groq_api_key)

def chat_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.2
) -> Generator[str, None, None]:
    """
    Chat completion
    """
    try:
        result = client.chat.completions.create(
            model=settings.groq_llm_model,
            messages=messages,
            temperature=temperature,
        )

        return result.choices[0].message.content.strip()

    except GroqError as e:
        raise e
    except Exception as e:
        raise e