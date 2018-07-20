package org.mozilla.vrbrowser.ui;

import android.transition.AutoTransition;
import android.transition.ChangeBounds;
import android.transition.Transition;
import android.transition.TransitionManager;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.animation.*;

public class AnimationHelper {
    private static final String LOGTAG = "VRB";
    public static final long FADE_ANIMATION_DURATION = 150;
    
    public static void fadeIn(View aView, long delay, final Runnable aCallback) {
        aView.setVisibility(View.VISIBLE);
        Animation animation = new AlphaAnimation(0, 1);
        animation.setInterpolator(new DecelerateInterpolator());
        animation.setDuration(FADE_ANIMATION_DURATION);
        animation.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {
            }

            @Override
            public void onAnimationEnd(Animation animation) {
                if (aCallback != null) {
                    aCallback.run();
                }
            }

            @Override
            public void onAnimationRepeat(Animation animation) {
            }
        });
        if (delay > 0) {
            animation.setStartOffset(delay);
        }
        aView.setAnimation(animation);
    }

    public static void fadeOut(final View aView, long delay, final Runnable aCallback) {
        aView.setVisibility(View.VISIBLE);
        Animation animation = new AlphaAnimation(1, 0);
        animation.setInterpolator(new AccelerateInterpolator());
        animation.setDuration(FADE_ANIMATION_DURATION);
        if (delay > 0) {
            animation.setStartOffset(delay);
        }
        animation.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {
            }

            @Override
            public void onAnimationEnd(Animation animation) {
                aView.setVisibility(View.GONE);
                if (aCallback != null) {
                    aCallback.run();
                }
            }

            @Override
            public void onAnimationRepeat(Animation animation) {
            }
        });

        aView.setAnimation(animation);
    }

    public static void animateViewsTransition(final ViewGroup aContainer,
                                              final ViewGroup fromViewGrounp,
                                              final ViewGroup toViewGrounp,
                                              final int delay) {
        ChangeBounds transition = new ChangeBounds();
        transition.setDuration(delay);
        transition.setInterpolator(new AccelerateDecelerateInterpolator());

        animateViewsTransition(aContainer, fromViewGrounp, toViewGrounp, transition);
    }

    public static void animateViewsTransition(final ViewGroup aContainer,
                                              final ViewGroup fromViewGrounp,
                                              final ViewGroup toViewGrounp,
                                              final Transition aTransition) {
        final ViewTreeObserver.OnDrawListener mDrawListener = new ViewTreeObserver.OnDrawListener() {
            @Override
            public void onDraw() {
                Log.d(LOGTAG, "Invalidating: " + aContainer.toString());
                aContainer.invalidate();
            }
        };
        aTransition.addListener(new Transition.TransitionListener() {
            @Override
            public void onTransitionStart(Transition transition) {
                aContainer.getViewTreeObserver().addOnDrawListener(mDrawListener);
            }

            @Override
            public void onTransitionEnd(Transition transition) {
                aContainer.getViewTreeObserver().removeOnDrawListener(mDrawListener);
            }

            @Override
            public void onTransitionCancel(Transition transition) {

            }

            @Override
            public void onTransitionPause(Transition transition) {

            }

            @Override
            public void onTransitionResume(Transition transition) {

            }
        });
        TransitionManager.beginDelayedTransition(aContainer, aTransition);
        fromViewGrounp.setVisibility(View.GONE);
        toViewGrounp.setVisibility(View.VISIBLE);
    }
}
