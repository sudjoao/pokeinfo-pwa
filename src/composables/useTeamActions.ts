import { computed, ref, shallowRef } from 'vue'
import { useRouter, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePokedexStore } from '@/stores/pokedex'
import { exportShowdown, importShowdown } from '@/utils/showdown'
import { suggestCounters } from '@/utils/typeChart'
import { formatPokemonName } from '@/utils/pokemon'
import { shareLink } from '@/composables/useShare'
import { useShareImage } from '@/composables/useShareImage'
import { useCry } from '@/composables/useCry'
import type { Game } from '@/data/games'
import type { TeamMember, useTeam } from './useTeam'

export type Team = ReturnType<typeof useTeam>

interface TeamActionsOptions {
  game: () => Game | null | undefined
  /** Jogo e Pokédex no formato da URL, levados ao detalhe e ao link compartilhado. */
  context: () => LocationQueryRaw
  /** Lista de onde saem as sugestões para as fraquezas (a lista atual, com os filtros). */
  candidates: () => readonly { id: number; name: string }[]
}

/**
 * Ações do painel do time (aba "Time" da Home e team builder): remover e limpar com desfazer,
 * sugestões, compartilhar link/imagem e Showdown. Os avisos e diálogos ficam em `TeamOverlays`.
 */
export function useTeamActions(team: Team, options: TeamActionsOptions) {
  const router = useRouter()
  const cry = useCry()
  const { t } = useI18n()
  const pokedex = usePokedexStore()

  const fullNotice = ref(false)
  const notice = ref<string | null>(null)
  const importOpen = ref(false)

  /** Limpar, remover pelo painel ou importar por cima não tem volta pelo navegador: o aviso oferece desfazer. */
  const undo = shallowRef<{ text: string; ids: number[] } | null>(null)

  function changeTeam(text: string, change: () => void): void {
    const before = [...team.ids.value]
    change()
    undo.value = before.length ? { text, ids: before } : null
  }

  function offerUndo(text: string, ids: number[]): void {
    undo.value = ids.length ? { text, ids } : null
  }

  function applyUndo(): void {
    if (undo.value) team.replace(undo.value.ids)
  }

  function removeMember(member: { id: number; name: string }): void {
    changeTeam(t('team.removed', { name: formatPokemonName(member.name) }), () =>
      team.remove(member.id),
    )
  }

  function clearTeam(): void {
    changeTeam(t('team.cleared'), team.clear)
  }

  /** Entra/sai do time; com 6 já escolhidos, avisa em vez de trocar. */
  function toggle(id: number): void {
    if (team.toggle(id) === 'full') fullNotice.value = true
  }

  const teamIds = computed(() => new Set(team.ids.value))

  /** Quem da lista atual (jogo, dex e filtros) cobre as fraquezas do time. */
  const suggestions = computed(() =>
    suggestCounters(
      options.candidates(),
      team.threats.value.map((row) => row.type),
      (id) => pokedex.typesOf(id),
      teamIds.value,
      options.game()?.generation,
    ),
  )

  /** Tocar em um membro abre o detalhe (com o grito no gesto, como na Home). */
  function openMember(member: TeamMember): void {
    cry.play(member.id)
    router.push({ name: 'pokemon', params: { id: member.id }, query: options.context() })
  }

  function shareTeam(): void {
    shareLink(t('team.share'), team.shareUrl(options.context())).then((result) => {
      if (result === 'copied') notice.value = t('common.linkCopied')
      else if (result === 'failed') notice.value = t('common.shareFailed')
    })
  }

  const shareImage = useShareImage()
  const shareImageAlt = computed(() =>
    t('shareImage.teamAlt', {
      names: team.members.value.map((member) => formatPokemonName(member.name)).join(', '),
    }),
  )

  function openShareImage(): void {
    const members = team.members.value
    shareImage.generate(
      async () => {
        const { teamImage } = await import('@/utils/shareImage')
        return teamImage(members, {
          title: t('shareImage.teamTitle'),
          subtitle: options.game()?.title,
          type: (type) => t(`type.${type}`),
          footer: `PokeInfo · ${window.location.host}`,
        })
      },
      'pokeinfo-time.png',
      t('team.share'),
    )
  }

  async function sendShareImage(): Promise<void> {
    const result = await shareImage.share()
    if (result === 'downloaded') notice.value = t('shareImage.downloaded')
    else if (result === 'failed') notice.value = t('common.shareFailed')
    else if (result === 'shared') shareImage.open.value = false
  }

  function copyShowdown(): void {
    const text = exportShowdown(team.members.value)
    navigator.clipboard
      .writeText(text)
      .then(() => (notice.value = t('team.exported')))
      .catch(() => (notice.value = text))
  }

  function pasteShowdown(text: string): void {
    const result = importShowdown(text, pokedex.index)
    const parts = [t('team.imported', result.ids.length)]
    if (result.unknown.length)
      parts.push(t('team.importUnknown', { names: result.unknown.join(', ') }))
    if (result.ids.length && team.ids.value.length) {
      changeTeam(parts.join(' '), () => team.replace(result.ids))
      return
    }
    if (result.ids.length) team.replace(result.ids)
    notice.value = parts.join(' ')
  }

  return {
    fullNotice,
    notice,
    importOpen,
    undo,
    offerUndo,
    applyUndo,
    removeMember,
    clearTeam,
    toggle,
    teamIds,
    suggestions,
    openMember,
    shareTeam,
    shareImage,
    shareImageAlt,
    openShareImage,
    sendShareImage,
    copyShowdown,
    pasteShowdown,
  }
}

export type TeamActions = ReturnType<typeof useTeamActions>
