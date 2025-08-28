# Building Code Agent Usage Guide

## Overview
The Building Code Agent provides access to state-specific building codes and regulations through the ServiceFlow AI Command Center playground. Currently supports Oklahoma building codes with plans for expansion to additional states.

## Available Building Codes

### Oklahoma (2018 Codes)
- **Residential Code (IRC 2018)**: Oklahoma residential building requirements
- **International Building Code (IBC 2018)**: Oklahoma commercial building code  
- **Existing Building Code (IEBC 2018)**: Oklahoma existing building modifications
- **Mechanical Code (IMC 2018)**: Oklahoma mechanical systems code

## How to Use in Playground

### 1. Access the Contractor Agent
- Open the ServiceFlow AI Command Center playground
- Select "Contractor Assistant with Building Codes" agent
- This agent has both building code access and general construction knowledge

### 2. Check Available Building Codes
```
show_available_codes()
```
This will display all available building codes by state.

### 3. Initialize State Building Codes  
```
initialize_state_codes("oklahoma")
```
Sets up the building codes for the specified state.

### 4. Query Building Codes
```
query_building_code("What are the minimum ceiling height requirements for residential buildings?", "oklahoma")
```

## Example Workflows

### Basic Building Code Query
1. **User**: "I need information about Oklahoma building codes"
2. **Agent**: Uses `show_available_codes()` to display options
3. **Agent**: Uses `initialize_state_codes("oklahoma")` 
4. **User**: "What are the fire safety requirements?"
5. **Agent**: Uses `query_building_code("fire safety requirements", "oklahoma")`

### Specific Code Section Lookup
1. **User**: "What are the electrical requirements for new construction in Oklahoma?"
2. **Agent**: Uses `initialize_state_codes("oklahoma")` if not already initialized
3. **Agent**: Uses `query_building_code("electrical requirements new construction", "oklahoma")`
4. **Agent**: Provides specific code sections and requirements

## Available Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `get_available_states()` | List available states | Returns: "oklahoma" |
| `show_available_codes()` | Show all building codes by state | Full code listing |
| `initialize_state_codes(state)` | Set up state building codes | `initialize_state_codes("oklahoma")` |
| `query_building_code(question, state)` | Ask specific building code questions | `query_building_code("ceiling height", "oklahoma")` |
| `get_code_types(state)` | Show code types for state | IRC, IBC, IEBC, IMC for Oklahoma |

## Common Use Cases

### Contractors & Builders
- Code compliance verification
- Permit application requirements
- Construction specifications
- Safety regulations

### Homeowners & DIY
- Residential building requirements
- Renovation code compliance  
- Safety standards
- Permit requirements

### Architects & Engineers
- Design specification requirements
- Structural code requirements
- Mechanical system codes
- Building standard references

## Sample Questions

### Residential Construction
- "What are the minimum ceiling heights for residential rooms?"
- "What are the electrical outlet requirements for kitchens?"
- "What are the stair railing height requirements?"

### Commercial Construction  
- "What are the fire exit requirements for commercial buildings?"
- "What are the ADA compliance requirements?"
- "What are the emergency lighting requirements?"

### Mechanical Systems
- "What are the HVAC ventilation requirements?"
- "What are the ductwork installation requirements?"
- "What are the mechanical room clearance requirements?"

## Technical Requirements

### Dependencies
```bash
pip install pypdf  # Required for PDF processing
```

### Environment Variables
- `MONGODB_URI` or `MONGODB_URL`: MongoDB connection for storing embeddings
- `OPENAI_API_KEY`: OpenAI API key for embeddings and chat

## Expanding to Additional States

To add new states:

1. **Add PDF URLs** in `data_scraper_agent.py`:
   ```python
   building_codes = {
       "oklahoma": [...existing URLs...],
       "texas": [
           "url_to_texas_irc.pdf",
           "url_to_texas_ibc.pdf",
           # etc.
       ]
   }
   ```

2. **Update available states**:
   ```python
   self.available_states = ["oklahoma", "texas"]
   ```

3. **Add code type descriptions**:
   ```python
   code_types = {
       "oklahoma": {...existing...},
       "texas": {
           "residential": "Texas Residential Code",
           "commercial": "Texas Commercial Building Code",
           # etc.
       }
   }
   ```

## Troubleshooting

### Common Issues

1. **"pypdf not installed"**
   - Solution: `pip install pypdf`

2. **"Building codes not available for [state]"**
   - Solution: Check available states with `get_available_states()`
   - Currently only Oklahoma is supported

3. **MongoDB connection errors**
   - Solution: Verify `MONGODB_URI` environment variable
   - Check MongoDB Atlas connection

4. **Slow PDF loading**
   - First-time initialization downloads and processes PDFs
   - Subsequent queries use cached embeddings

### Debug Commands
```python
# Check what's available
show_available_codes()

# Verify state support
get_available_states() 

# Check specific state codes
get_code_types("oklahoma")
```

## Support

For issues or feature requests:
- Check the `data_scraper_agent.py` file for implementation details
- Review the `building_code_agent.py` for interactive usage examples
- Ensure all dependencies are installed and environment variables are set