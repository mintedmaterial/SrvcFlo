#!/usr/bin/env python3
"""
DALLE Tools for ServiceFlow AI
Handles DALL-E 3 image generation with user management and billing
"""

import os
import json
import logging
import base64
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path
import hashlib

logger = logging.getLogger(__name__)

class DALLEImageGenerator:
    """DALL-E 3 image generation with user management"""
    
    def __init__(self, api_key: Optional[str] = None, storage_dir: str = "tmp/generated_images"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        if not self.api_key:
            logger.error("OpenAI API key not provided")
            raise ValueError("OpenAI API key required for DALL-E image generation")
        
        self.base_url = "https://api.openai.com/v1/images/generations"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Pricing (per image)
        self.pricing = {
            "1024x1024": 0.040,  # $0.04 per image
            "1024x1792": 0.080,  # $0.08 per image  
            "1792x1024": 0.080   # $0.08 per image
        }
    
    def _generate_filename(self, prompt: str, size: str) -> str:
        """Generate a unique filename for the image"""
        # Create hash of prompt for uniqueness
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"dalle_{timestamp}_{prompt_hash}_{size}.png"
    
    def _save_image_metadata(self, filename: str, metadata: Dict[str, Any]):
        """Save image metadata to JSON file"""
        metadata_file = self.storage_dir / f"{filename}.json"
        try:
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
            logger.info(f"Saved metadata for {filename}")
        except Exception as e:
            logger.error(f"Failed to save metadata: {e}")
    
    def generate_image(self, 
                      prompt: str,
                      size: str = "1024x1024",
                      quality: str = "standard",
                      style: str = "vivid",
                      user_id: Optional[str] = None,
                      save_local: bool = True) -> Dict[str, Any]:
        """Generate an image using DALL-E 3"""
        
        # Validate parameters
        valid_sizes = ["1024x1024", "1024x1792", "1792x1024"]
        if size not in valid_sizes:
            raise ValueError(f"Size must be one of: {valid_sizes}")
        
        valid_qualities = ["standard", "hd"]
        if quality not in valid_qualities:
            raise ValueError(f"Quality must be one of: {valid_qualities}")
        
        valid_styles = ["vivid", "natural"]
        if style not in valid_styles:
            raise ValueError(f"Style must be one of: {valid_styles}")
        
        # Prepare request
        payload = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,  # DALL-E 3 only supports n=1
            "size": size,
            "quality": quality,
            "style": style,
            "response_format": "url"  # Can be "url" or "b64_json"
        }
        
        try:
            logger.info(f"Generating image with prompt: {prompt[:100]}...")
            
            # Make API request
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                error_msg = f"DALL-E API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "success": False,
                    "error": error_msg,
                    "status_code": response.status_code
                }
            
            result = response.json()
            image_data = result.get("data", [])[0]
            
            # Extract image URL and revised prompt
            image_url = image_data.get("url")
            revised_prompt = image_data.get("revised_prompt", prompt)
            
            # Prepare response
            generation_result = {
                "success": True,
                "image_url": image_url,
                "prompt": prompt,
                "revised_prompt": revised_prompt,
                "size": size,
                "quality": quality,
                "style": style,
                "generated_at": datetime.now(),
                "user_id": user_id,
                "cost": self.pricing.get(size, 0.040)
            }
            
            # Save image locally if requested
            if save_local and image_url:
                try:
                    filename = self._generate_filename(prompt, size)
                    filepath = self.storage_dir / filename
                    
                    # Download image
                    image_response = requests.get(image_url, timeout=30)
                    if image_response.status_code == 200:
                        with open(filepath, 'wb') as f:
                            f.write(image_response.content)
                        
                        generation_result["local_path"] = str(filepath)
                        generation_result["filename"] = filename
                        
                        # Save metadata
                        self._save_image_metadata(filename, generation_result)
                        
                        logger.info(f"Saved image to {filepath}")
                    else:
                        logger.warning(f"Failed to download image: {image_response.status_code}")
                except Exception as e:
                    logger.error(f"Failed to save image locally: {e}")
            
            return generation_result
            
        except requests.exceptions.Timeout:
            error_msg = "Request timeout - DALL-E API took too long to respond"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    def generate_sonic_themed_image(self, 
                                   base_prompt: str,
                                   sonic_elements: List[str] = None,
                                   size: str = "1024x1024",
                                   user_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate a Sonic blockchain themed image"""
        
        if sonic_elements is None:
            sonic_elements = [
                "futuristic blockchain technology",
                "sonic blue color scheme", 
                "digital network patterns",
                "cryptocurrency symbols",
                "speed and innovation themes"
            ]
        
        # Enhance prompt with Sonic branding
        sonic_prompt = f"{base_prompt}, incorporating {', '.join(sonic_elements)}, "
        sonic_prompt += "high-tech aesthetic, professional design, vibrant colors, "
        sonic_prompt += "blockchain and DeFi themes, modern digital art style"
        
        return self.generate_image(
            prompt=sonic_prompt,
            size=size,
            quality="hd",
            style="vivid",
            user_id=user_id
        )
    
    def generate_nft_artwork(self,
                            collection_theme: str,
                            traits: Dict[str, str] = None,
                            size: str = "1024x1024",
                            user_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate NFT-style artwork"""
        
        prompt = f"NFT artwork: {collection_theme}, "
        
        if traits:
            trait_descriptions = []
            for trait_type, trait_value in traits.items():
                trait_descriptions.append(f"{trait_type}: {trait_value}")
            prompt += f"with traits: {', '.join(trait_descriptions)}, "
        
        prompt += "unique digital art, collectible style, high quality, "
        prompt += "suitable for NFT marketplace, distinctive and memorable"
        
        return self.generate_image(
            prompt=prompt,
            size=size,
            quality="hd", 
            style="vivid",
            user_id=user_id
        )
    
    def get_generation_history(self, user_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get generation history for a user or all users"""
        
        history = []
        
        try:
            # Scan metadata files
            for metadata_file in self.storage_dir.glob("*.json"):
                try:
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    
                    # Filter by user if specified
                    if user_id and metadata.get("user_id") != user_id:
                        continue
                    
                    history.append(metadata)
                    
                except Exception as e:
                    logger.error(f"Error reading metadata file {metadata_file}: {e}")
            
            # Sort by generation time (most recent first)
            history.sort(key=lambda x: x.get("generated_at", ""), reverse=True)
            
            # Limit results
            return history[:limit]
            
        except Exception as e:
            logger.error(f"Error getting generation history: {e}")
            return []
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get generation statistics for a user"""
        
        user_history = self.get_generation_history(user_id=user_id, limit=1000)
        
        stats = {
            "total_generations": len(user_history),
            "total_cost": sum(item.get("cost", 0) for item in user_history),
            "successful_generations": len([item for item in user_history if item.get("success", False)]),
            "failed_generations": len([item for item in user_history if not item.get("success", True)]),
            "sizes_used": {},
            "quality_used": {},
            "style_used": {},
            "recent_prompts": []
        }
        
        for item in user_history:
            # Count sizes
            size = item.get("size", "unknown")
            stats["sizes_used"][size] = stats["sizes_used"].get(size, 0) + 1
            
            # Count quality
            quality = item.get("quality", "unknown")
            stats["quality_used"][quality] = stats["quality_used"].get(quality, 0) + 1
            
            # Count style
            style = item.get("style", "unknown")  
            stats["style_used"][style] = stats["style_used"].get(style, 0) + 1
            
            # Collect recent prompts
            if len(stats["recent_prompts"]) < 5:
                stats["recent_prompts"].append({
                    "prompt": item.get("prompt", "")[:100],
                    "generated_at": item.get("generated_at", "")
                })
        
        return stats
    
    def estimate_cost(self, size: str, quality: str = "standard") -> float:
        """Estimate the cost of generating an image"""
        base_cost = self.pricing.get(size, 0.040)
        
        # HD quality costs 2x
        if quality == "hd":
            base_cost *= 2
        
        return base_cost

# =============================================================================
# TOOL FUNCTIONS FOR AGENT INTEGRATION
# =============================================================================

# Global DALL-E instance
_dalle_generator = None

def get_dalle_generator():
    """Get or create DALL-E generator instance"""
    global _dalle_generator
    if _dalle_generator is None:
        try:
            _dalle_generator = DALLEImageGenerator()
        except ValueError as e:
            logger.error(f"Failed to initialize DALL-E: {e}")
            return None
    return _dalle_generator

def generate_dalle_image(prompt: str, size: str = "1024x1024", user_id: str = "agent_user") -> str:
    """Generate an image using DALL-E 3
    
    Args:
        prompt (str): Description of the image to generate
        size (str): Image size (1024x1024, 1024x1792, 1792x1024)
        user_id (str): User identifier
        
    Returns:
        str: JSON string with generation result
    """
    generator = get_dalle_generator()
    if not generator:
        return json.dumps({"error": "DALL-E not available - check OPENAI_API_KEY"})
    
    try:
        result = generator.generate_image(
            prompt=prompt,
            size=size,
            user_id=user_id
        )
        return json.dumps(result, default=str, indent=2)
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        return json.dumps({"error": f"Image generation failed: {str(e)}"})

def generate_sonic_themed_image(base_prompt: str, user_id: str = "agent_user") -> str:
    """Generate a Sonic blockchain themed image
    
    Args:
        base_prompt (str): Base description for the image
        user_id (str): User identifier
        
    Returns:
        str: JSON string with generation result
    """
    generator = get_dalle_generator()
    if not generator:
        return json.dumps({"error": "DALL-E not available - check OPENAI_API_KEY"})
    
    try:
        result = generator.generate_sonic_themed_image(
            base_prompt=base_prompt,
            user_id=user_id
        )
        return json.dumps(result, default=str, indent=2)
    except Exception as e:
        logger.error(f"Sonic image generation failed: {e}")
        return json.dumps({"error": f"Sonic image generation failed: {str(e)}"})

def get_dalle_user_stats(user_id: str) -> str:
    """Get user generation statistics
    
    Args:
        user_id (str): User identifier
        
    Returns:
        str: JSON string with user stats
    """
    generator = get_dalle_generator()
    if not generator:
        return json.dumps({"error": "DALL-E not available"})
    
    try:
        stats = generator.get_user_stats(user_id)
        return json.dumps(stats, default=str, indent=2)
    except Exception as e:
        logger.error(f"Stats retrieval failed: {e}")
        return json.dumps({"error": f"Stats retrieval failed: {str(e)}"})

# Example usage
if __name__ == "__main__":
    try:
        # Initialize generator
        dalle = DALLEImageGenerator()
        
        # Generate a test image
        result = dalle.generate_image(
            prompt="A futuristic cityscape with blockchain networks visualized as glowing connections",
            size="1024x1024",
            quality="standard",
            style="vivid",
            user_id="test_user"
        )
        
        print("Generation result:")
        print(json.dumps(result, indent=2, default=str))
        
        # Generate Sonic-themed image
        sonic_result = dalle.generate_sonic_themed_image(
            base_prompt="A modern DeFi trading interface",
            user_id="test_user"
        )
        
        print("\nSonic-themed generation:")
        print(json.dumps(sonic_result, indent=2, default=str))
        
        # Get user stats
        stats = dalle.get_user_stats("test_user")
        print(f"\nUser stats:")
        print(json.dumps(stats, indent=2, default=str))
        
    except ValueError as e:
        print(f"Error: {e}")
        print("Make sure to set OPENAI_API_KEY environment variable")