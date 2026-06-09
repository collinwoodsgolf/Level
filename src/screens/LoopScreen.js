/**
 * LEVEL GOLF — The Loop
 * The social clubhouse: follow friends, share rounds, and compare
 * handicaps that are tied to the dynamic course rating — so everyone
 * knows an 82 in 20 mph gusts beats an 80 on a calm morning.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useStore } from '../services/store';
import { LOOP_FEED } from '../services/social';
import TopNav from '../components/TopNav';

// ─── Friends strip ───

function FriendChip({ friend }) {
  const trendUp = friend.trend > 0;
  const trendFlat = friend.trend === 0;
  return (
    <TouchableOpacity
      style={s.friendChip}
      activeOpacity={0.7}
      onPress={() => Alert.alert(
        friend.name,
        `Handicap ${friend.handicap} (vs dynamic rating)\n${friend.rounds} rounds · Home: ${friend.home}`,
      )}
    >
      <View style={s.friendAvatar}>
        <Text style={s.friendAvatarText}>{friend.initials}</Text>
      </View>
      <Text style={s.friendName} numberOfLines={1}>{friend.name.split(' ')[0]}</Text>
      <View style={s.friendHcpRow}>
        <Text style={s.friendHcp}>{friend.handicap}</Text>
        {!trendFlat && (
          <Text style={[s.friendTrend, { color: trendUp ? COLORS.red500 : COLORS.green400 }]}>
            {trendUp ? '▲' : '▼'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Feed post ───

function RoundPost({ post, bumped, onBump }) {
  const diff = post.differential;
  const beatRating = post.score < post.dynamicRating;
  const playedOver = post.dynamicRating > post.staticRating;
  return (
    <View style={s.post}>
      {/* Author */}
      <View style={s.postHeader}>
        <View style={s.postAvatar}>
          <Text style={s.postAvatarText}>{post.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.postName}>{post.name}</Text>
          <Text style={s.postMeta}>{post.when} · {post.course} · {post.tee} tees</Text>
        </View>
        {post.attested && (
          <View style={s.attestedBadge}>
            <Text style={s.attestedText}>✓</Text>
          </View>
        )}
      </View>

      {/* Score vs dynamic rating */}
      <View style={s.scoreRow}>
        <View style={s.scoreBig}>
          <Text style={s.scoreValue}>{post.score}</Text>
          {beatRating && <Text style={s.scoreCrown}>🔥</Text>}
        </View>
        <View style={s.scoreDetail}>
          <View style={s.scoreDetailRow}>
            <Text style={s.scoreDetailLabel}>Course played to</Text>
            <Text style={[s.scoreDetailValue, { color: playedOver ? COLORS.orange500 : COLORS.green400 }]}>
              {post.dynamicRating} / {post.dynamicSlope}
            </Text>
          </View>
          <View style={s.scoreDetailRow}>
            <Text style={s.scoreDetailLabel}>Static rating</Text>
            <Text style={s.scoreDetailValue}>{post.staticRating}</Text>
          </View>
          <View style={s.scoreDetailRow}>
            <Text style={s.scoreDetailLabel}>Differential</Text>
            <Text style={[s.scoreDetailValue, { color: COLORS.green400 }]}>
              {diff > 0 ? '+' : ''}{diff}
            </Text>
          </View>
        </View>
      </View>

      {!!post.caption && <Text style={s.caption}>{post.caption}</Text>}

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn} onPress={onBump} activeOpacity={0.7}>
          <Text style={[s.actionIcon, bumped && { transform: [{ scale: 1.1 }] }]}>
            {bumped ? '🤜🤛' : '🤜'}
          </Text>
          <Text style={[s.actionText, bumped && { color: COLORS.green400 }]}>
            {post.bumps + (bumped ? 1 : 0)} fist bumps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => Alert.alert('Comments', 'Comments coming in the next release.')}
          activeOpacity={0.7}
        >
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionText}>{post.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ───

export default function LoopScreen({ navigation }) {
  const friends = useStore(st => st.friends);
  const bumped = useStore(st => st.bumped);
  const toggleBump = useStore(st => st.toggleBump);
  const getHandicap = useStore(st => st.getHandicap);
  const hcp = getHandicap();
  const [feed] = useState(LOOP_FEED);

  return (
    <View style={s.container}>
      <TopNav navigation={navigation} title="THE LOOP" subtitle="Your golf circle, in the loop" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Your standing */}
        <View style={s.youCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.youLabel}>YOUR DYNAMIC HANDICAP</Text>
            <Text style={s.youSub}>Best 8 of last 20 · vs dynamic rating</Text>
          </View>
          <Text style={s.youHcp}>{hcp ?? '—'}</Text>
        </View>

        {/* Friends */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>FRIENDS</Text>
          <TouchableOpacity onPress={() => Alert.alert('Add Friends', 'Friend search and invites coming in the next release.')}>
            <Text style={s.addLink}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.friendsRow}>
          {friends.map(f => <FriendChip key={f.id} friend={f} />)}
        </ScrollView>

        {/* Feed */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>RECENT ROUNDS</Text>
        </View>
        {feed.map(post => (
          <RoundPost
            key={post.id}
            post={post}
            bumped={!!bumped[post.id]}
            onBump={() => toggleBump(post.id)}
          />
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Share round CTA */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => Alert.alert(
          'Share a Round',
          'Round sharing posts your GPS-attested score with the dynamic rating it was played against.',
        )}
      >
        <Text style={s.fabText}>＋ Share Round</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg },

  youCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E7F0E8', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.green500 + '33',
    padding: SPACING.lg, marginBottom: 8,
  },
  youLabel: { ...FONTS.bold, fontSize: 10, color: COLORS.green400, letterSpacing: 1 },
  youSub: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 3 },
  youHcp: { ...FONTS.black, fontSize: 34, color: COLORS.green400 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 16, marginBottom: 10,
  },
  sectionLabel: { ...FONTS.bold, fontSize: 11, color: COLORS.gray500, letterSpacing: 1.2 },
  addLink: { ...FONTS.semibold, fontSize: 13, color: COLORS.green500 },

  friendsRow: { gap: 10, paddingRight: SPACING.lg },
  friendChip: {
    width: 76, alignItems: 'center', backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    paddingVertical: 10,
  },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.green800,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  friendAvatarText: { ...FONTS.bold, fontSize: 13, color: COLORS.green400 },
  friendName: { ...FONTS.semibold, fontSize: 11, color: COLORS.ink },
  friendHcpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  friendHcp: { ...FONTS.heavy, fontSize: 12, color: COLORS.gray400 },
  friendTrend: { fontSize: 8, marginLeft: 3 },

  post: {
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg, marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.green800,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  postAvatarText: { ...FONTS.bold, fontSize: 13, color: COLORS.green400 },
  postName: { ...FONTS.semibold, fontSize: 14, color: COLORS.ink },
  postMeta: { ...FONTS.regular, fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  attestedBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.green900,
    alignItems: 'center', justifyContent: 'center',
  },
  attestedText: { ...FONTS.bold, fontSize: 11, color: COLORS.green400 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreBig: {
    width: 86, height: 86, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreValue: { ...FONTS.black, fontSize: 34, color: COLORS.ink },
  scoreCrown: { fontSize: 12, position: 'absolute', top: 6, right: 8 },
  scoreDetail: { flex: 1, gap: 6 },
  scoreDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreDetailLabel: { ...FONTS.regular, fontSize: 12, color: COLORS.gray500 },
  scoreDetailValue: { ...FONTS.bold, fontSize: 12, color: COLORS.gray300 },

  caption: { ...FONTS.regular, fontSize: 13, color: COLORS.gray300, lineHeight: 19, marginTop: 12 },

  actions: {
    flexDirection: 'row', gap: 22, marginTop: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.surfaceBorder,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 15 },
  actionText: { ...FONTS.semibold, fontSize: 12, color: COLORS.gray400 },

  fab: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: COLORS.green700, borderRadius: RADIUS.full,
    paddingHorizontal: 22, paddingVertical: 13,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabText: { ...FONTS.bold, fontSize: 15, color: COLORS.white },
});
