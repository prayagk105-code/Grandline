import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuickActionsBar } from '../components/home/QuickActionsBar';
import { TodayHabitsWidget } from '../components/home/TodayHabitsWidget';
import { UpcomingScheduleWidget } from '../components/home/UpcomingScheduleWidget';
import { DailyMissionsWidget } from '../components/home/DailyMissionsWidget';
import { DisciplineScoreCard } from '../components/home/DisciplineScoreCard';
import { ToastProvider } from '../contexts/ToastContext';
import { reminderService } from '../services/reminderService';
import { taskService } from '../services/taskService';
import { gamificationService } from '../services/gamificationService';
import { specialGrandlineService } from '../services/specialGrandlineService';
import type { DashboardSummaryDto } from '../types/api';

vi.mock('../services/reminderService');
vi.mock('../services/taskService');
vi.mock('../services/gamificationService');
vi.mock('../services/specialGrandlineService');

describe('Mobile Home UI Refinement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Quick Actions Bar', () => {
    it('renders all six required quick actions without renaming or removal', () => {
      const onQuickAdd = vi.fn();
      const onQuickCapture = vi.fn();

      render(
        <BrowserRouter>
          <QuickActionsBar onQuickAdd={onQuickAdd} onQuickCapture={onQuickCapture} />
        </BrowserRouter>
      );

      const expectedActions = [
        'Quick Add',
        'Quick Capture',
        'Start Focus',
        'Plan Day',
        'Daily Review',
        'New Goal'
      ];

      expectedActions.forEach((actionName) => {
        expect(screen.getByText(actionName)).toBeInTheDocument();
      });

      // Quick Add should have primary styling
      const quickAddBtn = screen.getByText('Quick Add').closest('button');
      expect(quickAddBtn).toHaveClass('home-quick-btn-pri');

      // Click Quick Add
      fireEvent.click(quickAddBtn!);
      expect(onQuickAdd).toHaveBeenCalledTimes(1);

      // Click Quick Capture
      const quickCaptureBtn = screen.getByText('Quick Capture').closest('button');
      fireEvent.click(quickCaptureBtn!);
      expect(onQuickCapture).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Today Habits Widget', () => {
    const mockSummary: DashboardSummaryDto = {
      todayDate: '2026-11-15',
      journeyDay: 42,
      journeyTotalDays: 180,
      completedHabitsToday: 2,
      totalActiveHabits: 4,
      completionPercentToday: 50,
      nextIncompleteHabitName: 'Read 20 pages',
      currentStreakDays: 7,
      bestStreakDays: 14,
      focusMinutesLast7Days: 120,
      habitAverageLast7Days: 75,
      last7Days: [],
      recentMemories: [],
      todayHabits: [
        {
          id: 'h1',
          name: 'Morning Meditation',
          category: 'Mindfulness',
          icon: 'sun',
          target: '10 mins daily',
          completedToday: true,
          isActive: true,
          createdAtUtc: '2026-11-01T00:00:00Z'
        },
        {
          id: 'h2',
          name: 'Drink 2L Water',
          category: 'Health',
          icon: 'drop',
          target: 'Hydrate properly',
          completedToday: true,
          isActive: true,
          createdAtUtc: '2026-11-01T00:00:00Z'
        },
        {
          id: 'h3',
          name: 'Read 20 pages',
          category: 'Study',
          icon: 'book',
          target: 'Chapter 4',
          completedToday: false,
          isActive: true,
          createdAtUtc: '2026-11-01T00:00:00Z'
        },
        {
          id: 'h4',
          name: 'Evening Journal',
          category: 'Personal',
          icon: 'pen',
          target: 'Reflection',
          completedToday: false,
          isActive: true,
          createdAtUtc: '2026-11-01T00:00:00Z'
        }
      ]
    };

    it('renders compact summary card with collapsed preview and expandable view', async () => {
      const onToggleHabit = vi.fn();

      render(
        <BrowserRouter>
          <TodayHabitsWidget
            summary={mockSummary}
            busyHabitId={null}
            onToggleHabit={onToggleHabit}
          />
        </BrowserRouter>
      );

      // Heading, completed count and next habit info
      expect(screen.getByText("Today's Habits")).toBeInTheDocument();
      expect(screen.getByText('2 of 4 habits done')).toBeInTheDocument();
      expect(screen.getByText('Next: Read 20 pages')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      // In collapsed view, only initial 2 habits are visible
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
      expect(screen.getByText('Drink 2L Water')).toBeInTheDocument();
      expect(screen.queryByText('Read 20 pages')).not.toBeInTheDocument();
      expect(screen.queryByText('Evening Journal')).not.toBeInTheDocument();

      // View All button is present
      const viewAllBtn = screen.getByRole('button', { name: /view all/i });
      expect(viewAllBtn).toBeInTheDocument();

      // Click to expand
      fireEvent.click(viewAllBtn);

      // Now all 4 habits should be visible
      expect(screen.getByText('Read 20 pages')).toBeInTheDocument();
      expect(screen.getByText('Evening Journal')).toBeInTheDocument();

      // Button changed to View Less
      const viewLessBtn = screen.getByRole('button', { name: /view less/i });
      expect(viewLessBtn).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(viewLessBtn);
      expect(screen.queryByText('Read 20 pages')).not.toBeInTheDocument();

      // Check toggling habit
      const checkBtn = screen.getByRole('button', { name: /uncheck morning meditation/i });
      fireEvent.click(checkBtn);
      expect(onToggleHabit).toHaveBeenCalledWith(mockSummary.todayHabits[0]);
    });
  });

  describe('3. Upcoming Schedule Widget', () => {
    it('renders compact summary card with collapsed preview and expand/collapse interaction', async () => {
      vi.mocked(reminderService.getAll).mockResolvedValue([
        {
          id: 'rem-1',
          title: 'Review Project Specs',
          reminderDate: '2026-11-15',
          reminderTime: '10:00:00',
          isActive: true
        } as any,
        {
          id: 'rem-2',
          title: 'Doctor Appointment',
          reminderDate: '2026-11-16',
          reminderTime: '15:30:00',
          isActive: true
        } as any
      ]);

      vi.mocked(taskService.getAll).mockResolvedValue([
        {
          id: 'task-1',
          title: 'Overdue Bugfix',
          dueDate: '2026-11-14',
          isCompleted: false,
          priority: 'High'
        } as any,
        {
          id: 'task-2',
          title: 'Deploy to Staging',
          dueDate: '2026-11-17',
          isCompleted: false,
          priority: 'Med'
        } as any
      ]);

      render(
        <BrowserRouter>
          <UpcomingScheduleWidget />
        </BrowserRouter>
      );

      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByText('Upcoming Schedule')).toBeInTheDocument();
      });

      // Calendar link
      expect(screen.getByText('Calendar')).toBeInTheDocument();

      // Overdue item comes first
      expect(screen.getByText('Overdue Bugfix')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();

      // In collapsed view, only top 2 items are shown
      expect(screen.getByText('Review Project Specs')).toBeInTheDocument();
      expect(screen.queryByText('Doctor Appointment')).not.toBeInTheDocument();

      // Expand to view all
      const viewMoreBtn = screen.getByRole('button', { name: /view more/i });
      expect(viewMoreBtn).toBeInTheDocument();
      fireEvent.click(viewMoreBtn);

      // Now remaining items are visible
      expect(screen.getByText('Doctor Appointment')).toBeInTheDocument();
      expect(screen.getByText('Deploy to Staging')).toBeInTheDocument();

      // Collapse back
      const viewLessBtn = screen.getByRole('button', { name: /view less/i });
      fireEvent.click(viewLessBtn);
      expect(screen.queryByText('Doctor Appointment')).not.toBeInTheDocument();
    });
  });

  describe('4. Daily Missions Widget', () => {
    it('renders compact missions card and handles view more and claim', async () => {
      vi.mocked(gamificationService.getStatus).mockResolvedValue({
        level: 5,
        xpInCurrentLevel: 350,
        xpToNextLevel: 1000,
        tierTitle: 'Navigator',
        totalXp: 4350,
        unclaimedRewardsCount: 1,
        dailyMissions: [
          {
            id: 'm1',
            title: 'Complete 3 habits',
            currentCount: 3,
            targetCount: 3,
            xpReward: 50,
            isClaimed: false
          },
          {
            id: 'm2',
            title: 'Focus for 25 mins',
            currentCount: 15,
            targetCount: 25,
            xpReward: 75,
            isClaimed: false
          },
          {
            id: 'm3',
            title: 'Write a reflection',
            currentCount: 0,
            targetCount: 1,
            xpReward: 40,
            isClaimed: false
          }
        ]
      } as any);

      render(
        <ToastProvider>
          <DailyMissionsWidget />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Daily Missions')).toBeInTheDocument();
      });

      // Level and XP information
      expect(screen.getByText('Level 5 · 350/1000 XP')).toBeInTheDocument();
      expect(screen.getByText('Navigator')).toBeInTheDocument();

      // In collapsed view, 2 missions visible
      expect(screen.getByText('Complete 3 habits')).toBeInTheDocument();
      expect(screen.getByText('Focus for 25 mins')).toBeInTheDocument();
      expect(screen.queryByText('Write a reflection')).not.toBeInTheDocument();

      // Claim button for completed mission
      const claimBtn = screen.getByRole('button', { name: 'Claim' });
      expect(claimBtn).toBeInTheDocument();

      // Expand to view more
      const viewMoreBtn = screen.getByRole('button', { name: /view more/i });
      fireEvent.click(viewMoreBtn);

      expect(screen.getByText('Write a reflection')).toBeInTheDocument();
    });
  });

  describe('5. Discipline Score Card', () => {
    it('renders main score and 3 inner cards instead of horizontal lines', async () => {
      vi.mocked(specialGrandlineService.getDisciplineScore).mockResolvedValue({
        overallScore: 84,
        scoreTier: 'High Consistency',
        ratingTitle: 'High Consistency',
        habitScore: 90,
        focusScore: 80,
        taskScore: 82,
        factorBreakdowns: [
          'Habit consistency 90% over 30 days',
          'Focus sessions completed: 80%',
          'Task execution on time: 82%'
        ]
      } as any);

      render(<DisciplineScoreCard />);

      await waitFor(() => {
        expect(screen.getByText('Discipline Score')).toBeInTheDocument();
      });

      // Prominent main score
      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText('/ 100')).toBeInTheDocument();
      expect(screen.getByText('High Consistency')).toBeInTheDocument();

      // 3 Inner cards: Habits, Focus, Tasks with percentages & weights
      expect(screen.getByText('Habits')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();

      expect(screen.getByText('Focus')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();

      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();

      // View formula button & modal
      const formulaBtn = screen.getByRole('button', { name: /view mathematical formula/i });
      fireEvent.click(formulaBtn);

      expect(screen.getByText('Discipline Score Formula')).toBeInTheDocument();
      expect(screen.getByText(/Grandline strictly rejects fabricated/i)).toBeInTheDocument();

      const understoodBtn = screen.getByRole('button', { name: 'Understood' });
      fireEvent.click(understoodBtn);

      expect(screen.queryByText('Discipline Score Formula')).not.toBeInTheDocument();
    });
  });
});
