"""
Constants for the events app, including tier icons and gradients.
These should match the frontend definitions in:
- frontend/src/components/Organizer/CreateEvent/Tickets/Tiers/TierIconSelector.tsx
- frontend/src/constants/tierGradients.ts
"""

# ==============================================================================
# Tier Icon Choices
# ==============================================================================

class TierIcon:
    """Predefined tier icon identifiers matching frontend SVG assets."""
    TICKET = 'ticket'
    CROWN = 'crown'
    DIAMOND = 'diamond'
    SHIELD = 'shield'
    STAR = 'star'
    FLASH = 'flash'

    CHOICES = [
        (TICKET, 'Ticket'),
        (CROWN, 'Crown'),
        (DIAMOND, 'Diamond'),
        (SHIELD, 'Shield'),
        (STAR, 'Star'),
        (FLASH, 'Flash'),
    ]


# ==============================================================================
# Tier Gradient Choices
# ==============================================================================

class TierGradient:
    """
    Predefined tier gradient identifiers matching frontend tierGradients.ts.
    Each gradient has associated hex colors defined in the frontend.
    """
    GREY = 'grey'
    WHITE = 'white'
    RUBY = 'ruby'
    EMERALD = 'emerald'
    GOLD = 'gold'
    PURPLE = 'purple'
    SKY = 'sky'
    DIAMOND = 'diamond'

    CHOICES = [
        (GREY, 'Grey'),
        (WHITE, 'White'),
        (RUBY, 'Ruby'),
        (EMERALD, 'Emerald'),
        (GOLD, 'Gold'),
        (PURPLE, 'Purple'),
        (SKY, 'Sky'),
        (DIAMOND, 'Diamond'),
    ]

    # Optional: Store gradient definitions for backend use if needed
    GRADIENT_DEFINITIONS = {
        GREY: {'from': '#B4B8B3', 'to': '#B4B8B3'},
        WHITE: {'from': '#F7F7F7', 'to': '#F7F7F7'},
        RUBY: {'from': '#EC008C', 'to': '#FC6767'},
        EMERALD: {'from': '#A8FF78', 'to': '#78FFD6'},
        GOLD: {'from': '#FFD773', 'to': '#FF954A'},
        PURPLE: {'from': '#7F00FF', 'to': '#E100FF'},
        SKY: {'from': '#7F7FD5', 'via': '#86A8E7', 'to': '#91EAE4'},
        DIAMOND: {'from': '#B2FEFA', 'to': '#0ED2F7'},
    }
