# Project Overview

## About the Project
FeedLoop is a mobile-first social platform for localized community boards. It allows neighbors to post real-time updates, local events, ask questions, share recommendations, and support each other in a clean, hyper-local feed.

## The Problem It Solves
Traditional social networks are bloated, non-local, or algorithmically manipulated. FeedLoop provides a lightweight, real-time, chronological local board where neighbors can see what is happening *right now* within their physical proximity, facilitating immediate real-world connection and assistance.

## Pages
- `/` - Splash / Onboarding & Authentication. Simple login/signup with location setup.
- `/board` - The Main Local Feed. Chronological scroll of posts, alerts, and events with a toggle between "Feed" and "Events" views. Includes a compact post creator.
- `/post/:id` - Post Detail View. Displays the full text of a post, high-res image if attached, and a tight, compact thread of replies.
- `/event/:id` - Event Detail View. Shows event timing, description, RSVP counts, and integrated RSVP button.
- `/profile` - User Settings & Profile. Manage name, local avatar, active neighborhood boundary radius (e.g., 0.5mi, 1mi, 5mi), and user's past posts/RSVPs.
- `/notifications` - Action Center. Shows alerts for replies, event reminders, or urgent local warnings in the selected radius.

## Navigation
- **Top Header Bar**: Left-aligned location badge (toggles radius selector), centered FeedLoop logo, right-aligned notifications icon.
- **Bottom Navigation Bar**: Fixed at the bottom of the viewport with a blurred glass background:
  - Feed (Icon)
  - Events (Icon)
  - Create (+) - Centered accented floating action button
  - Profile (Icon)

## Core User Flow
1. **Onboarding**: User lands, grants location permission, and gets instantly matched to their local neighborhood board.
2. **Access/Auth**: Signs in via Firebase Auth (Google or Email/Password).
3. **Browsing**: User scrolls the chronological board of posts and RSVP events.
4. **Interacting**: User taps a post to view replies, comments on a post, or RSVPs to a local barbecue event.
5. **Posting**: User taps the "+" FAB, types a quick note, attaches a photo (stored in Firebase Storage), and hits post. The post is instantly available to all active users within their neighborhood radius via Firestore real-time listeners.
