import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Box,
  CardActionArea,
  Stack,
  alpha,
  useTheme
} from '@mui/material'
import { PlayArrow, Folder, Lock } from '@mui/icons-material'
import { buildGamePlaceholder } from '../utils/placeholders'

const getGameImage = async (slug) => {
  try {
    // Tentar importar de assets (desenvolvimento)
    const image = await import(`../assets/games/${slug}.jpg`)
    return image.default
  } catch {
    // Fallback: tentar URL direta (produção)
    try {
      const response = await fetch(`/assets/games/${slug}.jpg`, { method: 'HEAD' })
      if (response.ok) {
        return `/assets/games/${slug}.jpg`
      }
    } catch {
      // Imagem não encontrada
    }
    return null
  }
}

function GameCard({ game }) {
  const theme = useTheme()
  const navigate = useNavigate()
  const [coverImage, setCoverImage] = useState(buildGamePlaceholder(game.name, 600, 320))
  const hasAccess = game.hasAccess !== false

  useEffect(() => {
    const loadImage = async () => {
      const slug = game.folderPath?.split('/').pop() || game.slug
      if (!slug) {
        return
      }

      const image = await getGameImage(slug)
      if (image) {
        setCoverImage(image)
      }
    }

    loadImage()
  }, [game])

  const handlePlayClick = (event) => {
    event.stopPropagation()
    navigate(`/game/${game.id}`)
  }

  const handleCardClick = () => {
    navigate(`/game/${game.id}`)
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette?.gradient?.card,
        border: '1px solid rgba(55,126,86,0.18)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <CardActionArea onClick={handleCardClick} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="170"
            image={coverImage}
            alt={game.name}
            sx={{ objectFit: 'cover', filter: hasAccess ? 'none' : 'grayscale(0.6)' }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(7,13,10,0) 40%, rgba(7,13,10,0.9) 95%)'
            }}
          />
          {!hasAccess && (
            <Chip
              icon={<Lock />}
              label="Acesso necessário"
              color="warning"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: '#d97706'
              }}
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography
              variant="h6"
              component="div"
              noWrap
              sx={{ fontWeight: 600, letterSpacing: '0.02em' }}
            >
              {game.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: alpha('#e6f3eb', 0.65),
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {game.description || 'Sem descrição disponível'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {game.category && (
              <Chip
                label={game.category}
                size="small"
                sx={{
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: alpha('#37b464', 0.15),
                  border: '1px solid rgba(71,179,107,0.35)',
                  color: '#9deab2'
                }}
              />
            )}
            {game.folderPath && (
              <Chip
                icon={<Folder />}
                label="Local"
                size="small"
                sx={{
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: alpha('#101b17', 0.8),
                  border: '1px solid rgba(88, 126, 103, 0.5)'
                }}
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>

      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handlePlayClick}
          sx={{
            py: 1.1,
            fontWeight: 700,
            letterSpacing: '0.08em'
          }}
        >
          {hasAccess ? 'Jogar Agora' : 'Solicitar Acesso'}
        </Button>
      </Box>
    </Card>
  )
}

export default GameCard

