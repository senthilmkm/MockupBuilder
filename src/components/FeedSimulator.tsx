import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';

export type FeedSimulatorMode = 'Twitter' | 'LinkedIn' | 'None';

interface FeedSimulatorProps {
  mode: FeedSimulatorMode;
  children: React.ReactNode;
}

export const FeedSimulator: React.FC<FeedSimulatorProps> = ({ mode, children }) => {
  if (mode === 'None') {
    return <>{children}</>;
  }

  const renderTwitterFeed = () => {
    return (
      <View style={styles.twitterCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.twitterAvatar} />
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.twitterName}>Mockup Builder</Text>
              <Text style={styles.twitterHandle}>@mockup_builder • 2h</Text>
            </View>
            <Text style={styles.postBodyText}>
              Just shipped the brand new layout engine for MockupBuilder! What do you think of the new Bezel styles? 🚀 #buildinpublic
            </Text>
          </View>
        </View>

        {/* Media Attachment (The Canvas itself) */}
        <View style={styles.twitterMediaContainer}>
          {children}
        </View>

        {/* Engagement Footer */}
        <View style={styles.twitterFooter}>
          <View style={styles.footerAction}>
            <View style={[styles.actionIcon, { borderColor: '#536471' }]} />
            <Text style={styles.actionCount}>12</Text>
          </View>
          <View style={styles.footerAction}>
            <View style={[styles.actionIcon, { borderColor: '#00BA7C' }]} />
            <Text style={[styles.actionCount, { color: '#00BA7C' }]}>4</Text>
          </View>
          <View style={styles.footerAction}>
            <View style={[styles.actionIcon, { borderColor: '#F91880' }]} />
            <Text style={[styles.actionCount, { color: '#F91880' }]}>84</Text>
          </View>
          <View style={styles.footerAction}>
            <View style={[styles.actionIcon, { borderColor: '#1D9BF0' }]} />
            <Text style={styles.actionCount}>4.8K</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLinkedInFeed = () => {
    return (
      <View style={styles.linkedinCard}>
        {/* Profile Info */}
        <View style={styles.postHeader}>
          <View style={styles.linkedinAvatar} />
          <View style={styles.profileDetails}>
            <Text style={styles.linkedinName}>John Developer</Text>
            <Text style={styles.linkedinTitle}>Solopreneur & Founder • 1st</Text>
            <Text style={styles.linkedinTime}>2h • Edited • 🌐</Text>
          </View>
        </View>

        {/* Post Text */}
        <Text style={styles.linkedinBodyText}>
          I'm thrilled to share that we just launched our new mobile-first screenshot generator tool. Creating beautiful social media graphics has never been easier. We'd love your feedback! Check it out below:
        </Text>

        {/* Media (The Canvas itself) */}
        <View style={styles.linkedinMediaContainer}>
          {children}
        </View>

        {/* Likes / Actions Footer */}
        <View style={styles.linkedinEngagement}>
          <View style={styles.engagementInfo}>
            <View style={styles.likeIcons}>
              <View style={[styles.likeDot, { backgroundColor: '#378fe9' }]} />
              <View style={[styles.likeDot, { backgroundColor: '#6da744' }]} />
            </View>
            <Text style={styles.engagementText}>42 reactions • 9 comments</Text>
          </View>
          
          <View style={styles.linkedinActions}>
            <View style={styles.linkedinActionItem}>
              <View style={styles.linkedinIconDot} />
              <Text style={styles.linkedinActionText}>Like</Text>
            </View>
            <View style={styles.linkedinActionItem}>
              <View style={styles.linkedinIconDot} />
              <Text style={styles.linkedinActionText}>Comment</Text>
            </View>
            <View style={styles.linkedinActionItem}>
              <View style={styles.linkedinIconDot} />
              <Text style={styles.linkedinActionText}>Repost</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {mode === 'Twitter' ? renderTwitterFeed() : renderLinkedInFeed()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38444d',
  },
  // Twitter Styles
  twitterCard: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  twitterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d9bf0',
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  twitterName: {
    color: '#E7E9EA',
    fontWeight: 'bold',
    fontSize: 14,
  },
  twitterHandle: {
    color: '#71767B',
    fontSize: 12,
  },
  postBodyText: {
    color: '#E7E9EA',
    fontSize: 14,
    lineHeight: 18,
  },
  twitterMediaContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2F3336',
    marginTop: 8,
  },
  twitterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 10,
    paddingTop: 4,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  actionCount: {
    color: '#71767B',
    fontSize: 11,
  },
  // LinkedIn Styles
  linkedinCard: {
    width: '100%',
    backgroundColor: '#1D2226',
    borderRadius: 8,
    paddingVertical: 12,
  },
  linkedinAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8e969c',
  },
  linkedinName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  linkedinTitle: {
    color: '#9E9E9E',
    fontSize: 11,
    marginTop: 1,
  },
  linkedinTime: {
    color: '#757575',
    fontSize: 10,
    marginTop: 2,
  },
  linkedinBodyText: {
    color: '#E9E9E9',
    fontSize: 13,
    lineHeight: 17,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  linkedinMediaContainer: {
    width: '100%',
    backgroundColor: '#0A0A0A',
  },
  linkedinEngagement: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  engagementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderColor: '#38434F',
    paddingBottom: 8,
  },
  likeIcons: {
    flexDirection: 'row',
  },
  likeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1D2226',
  },
  engagementText: {
    color: '#9E9E9E',
    fontSize: 10,
  },
  linkedinActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  linkedinActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  linkedinIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#757575',
  },
  linkedinActionText: {
    color: '#9E9E9E',
    fontSize: 11,
    fontWeight: '600',
  },
});
