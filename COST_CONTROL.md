# Cost Control Guide

## Anthropic API Usage Protection

Anthropic (Claude) is expensive compared to Gemini. This guide explains how the fallback system works and how to control costs.

## How It Works

### Default Behavior
- **Gemini is always tried first** (free/cheap)
- **Anthropic is ONLY used** when:
  - Gemini fails with a **permanent error** (not rate limits)
  - `USE_ANTHROPIC_FALLBACK` is set to `true` (default)
  - Anthropic API key is configured

### Rate Limits Protection
- **Rate limits (429 errors) NEVER use Anthropic**
- Gemini rate limits will retry automatically
- If retry fails, the request fails (doesn't fall back to Anthropic)
- This prevents expensive Anthropic usage during temporary quota issues

## Environment Variables

### `USE_ANTHROPIC_FALLBACK`
- **Default**: `true` (if not set)
- **Set to `false`**: Completely disables Anthropic fallback
- **Recommendation**: Set to `false` in production to avoid unexpected costs

### Example `.env.local`:
```bash
# Disable Anthropic fallback to save money
USE_ANTHROPIC_FALLBACK=false

# Or keep it enabled but be aware of costs
USE_ANTHROPIC_FALLBACK=true
```

## When Anthropic Is Used

✅ **Will use Anthropic** (if enabled):
- Gemini API returns 500 error
- Gemini API returns 401/403 (auth errors)
- Gemini model not found (404)
- Invalid response structure
- Network errors

❌ **Will NOT use Anthropic**:
- Rate limit errors (429)
- Quota exceeded errors
- Any error containing "quota" or "rate limit"

## Monitoring

Check your logs for these warnings:
- `⚠️  WARNING: Using expensive Anthropic fallback` - Anthropic is being used
- `❌ Gemini rate limit hit. NOT using expensive Anthropic fallback` - Rate limit protection working

## Model Selection (Opus Blocked)

### Allowed Models
- ✅ `claude-haiku-20240307` - **Cheapest** (default)
- ✅ `claude-sonnet-4-20250514` - Mid-tier
- ✅ `claude-3-5-sonnet-20241022` - Alternative Sonnet
- ✅ `claude-3-haiku-20240307` - Alternative Haiku

### Blocked Models
- ❌ **ALL Opus models** - Automatically blocked (most expensive)
- ❌ Any model containing "opus" in the name

### Configuration
Set `ANTHROPIC_MODEL` in your `.env.local`:
```bash
# Use cheapest option (default)
ANTHROPIC_MODEL=claude-haiku-20240307

# Or use mid-tier Sonnet
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

**Important**: Even if you try to set an Opus model, it will be automatically blocked and replaced with the default (Haiku).

## Cost Recommendations

1. **Development**: Keep `USE_ANTHROPIC_FALLBACK=true` for reliability
2. **Production**: Set `USE_ANTHROPIC_FALLBACK=false` to avoid unexpected costs
3. **Model**: Always use `claude-haiku-20240307` (cheapest) unless you need Sonnet's capabilities
4. **Monitor**: Check logs regularly for Anthropic usage warnings
5. **Rate Limits**: If you hit Gemini rate limits frequently, upgrade your Gemini quota instead of relying on Anthropic
6. **Opus Protection**: Opus is automatically blocked - you cannot accidentally use it

## Disabling Anthropic Completely

To completely disable Anthropic (safest for cost control):

1. Set `USE_ANTHROPIC_FALLBACK=false` in `.env.local`
2. Or remove `ANTHROPIC_API_KEY` from your environment variables

The app will work fine with just Gemini - Anthropic is purely a fallback for edge cases.
