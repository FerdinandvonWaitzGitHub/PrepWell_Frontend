import { useMemo } from 'react';
import { useCalendar } from '../contexts/calendar-context';
import { useTimer } from '../contexts/timer-context';
import { useExams } from '../contexts/exams-context';
import { useCheckIn } from '../contexts/checkin-context';

/**
 * useStatistics - Comprehensive statistics hook for Mentor feature
 *
 * Calculates all learning statistics from calendar, timer, and exam data.
 */
export const useStatistics = () => {
  const {
    slotsByDate,
    contentsById,
    tasksByDate,
    contentPlans,
    lernplanMetadata,
    getContent
  } = useCalendar();

  const { timerHistory, getTimerStats } = useTimer();
  const { exams, stats: examStats } = useExams();
  const { wellScore: checkInWellScore, wellScoreTrend: checkInWellScoreTrend } = useCheckIn();

  // Helper functions
  const getDateKey = (date) => date.toISOString().split('T')[0];
  const today = new Date();
  const todayKey = getDateKey(today);

  // Get date range helpers
  const getDaysAgo = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return getDateKey(date);
  };

  const weekAgoKey = getDaysAgo(7);
  const twoWeeksAgoKey = getDaysAgo(14);
  const monthAgoKey = getDaysAgo(30);
  const fourWeeksAgoKey = getDaysAgo(28);

  /**
   * LERNZEIT STATISTIKEN
   */
  const lernzeitStats = useMemo(() => {
    const timerStats = getTimerStats();

    // Calculate learning time from timer history
    const allSessions = timerHistory || [];
    const totalSeconds = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Get unique learning days
    const learningDays = new Set(allSessions.map(s => s.date)).size;

    // Get unique weeks
    const weeks = new Set(allSessions.map(s => {
      const date = new Date(s.date);
      const weekNum = Math.ceil((date.getDate()) / 7);
      return `${date.getFullYear()}-${date.getMonth()}-${weekNum}`;
    })).size;

    // Get unique months
    const months = new Set(allSessions.map(s => {
      const date = new Date(s.date);
      return `${date.getFullYear()}-${date.getMonth()}`;
    })).size;

    // Session durations
    const sessionDurations = allSessions.map(s => s.duration || 0);
    const longestSession = sessionDurations.length > 0 ? Math.max(...sessionDurations) : 0;
    const shortestSession = sessionDurations.filter(d => d > 0).length > 0
      ? Math.min(...sessionDurations.filter(d => d > 0))
      : 0;

    // This week vs last week
    const thisWeekSessions = allSessions.filter(s => s.date >= weekAgoKey);
    const lastWeekSessions = allSessions.filter(s => s.date >= twoWeeksAgoKey && s.date < weekAgoKey);

    const thisWeekTime = thisWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const lastWeekTime = lastWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // 4-week trend
    const weeks4Trend = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = getDaysAgo((i + 1) * 7);
      const weekEnd = getDaysAgo(i * 7);
      const weekSessions = allSessions.filter(s => s.date >= weekStart && s.date < weekEnd);
      const weekTime = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      weeks4Trend.unshift({ week: i + 1, time: weekTime });
    }

    const trendDirection = weeks4Trend.length >= 2
      ? (weeks4Trend[weeks4Trend.length - 1].time > weeks4Trend[0].time ? 'up' : 'down')
      : 'stable';

    return {
      avgPerLearningDay: learningDays > 0 ? totalSeconds / learningDays : 0,
      avgPerWeek: weeks > 0 ? totalSeconds / weeks : 0,
      avgPerMonth: months > 0 ? totalSeconds / months : 0,
      longestSession,
      shortestSession,
      totalTime: totalSeconds,
      thisWeekTime,
      lastWeekTime,
      weekComparison: lastWeekTime > 0 ? ((thisWeekTime - lastWeekTime) / lastWeekTime) * 100 : 0,
      weeks4Trend,
      trendDirection,
      todayStats: timerStats.today,
      weekStats: timerStats.week
    };
  }, [timerHistory, getTimerStats, weekAgoKey, twoWeeksAgoKey]);

  /**
   * ZEITPUNKTE & MUSTER
   */
  const zeitMusterStats = useMemo(() => {
    const allSessions = timerHistory || [];

    // Analyze start hours
    const hourCounts = {};
    const dayOfWeekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayOfWeekTime = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    allSessions.forEach(session => {
      if (session.startTime) {
        const startDate = new Date(session.startTime);
        const hour = startDate.getHours();
        const dayOfWeek = startDate.getDay();

        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayOfWeekCounts[dayOfWeek]++;
        dayOfWeekTime[dayOfWeek] += session.duration || 0;
      }
    });

    // Find most productive hour
    const productiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Find most/least productive weekday
    const sortedDays = Object.entries(dayOfWeekTime).sort(([, a], [, b]) => b - a);
    const productiveDay = sortedDays[0]?.[0];
    const unproductiveDay = sortedDays[sortedDays.length - 1]?.[0];

    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    // Time of day distribution
    const timeOfDayDist = {
      morning: 0,   // 6-12
      afternoon: 0, // 12-18
      evening: 0    // 18-24
    };

    Object.entries(hourCounts).forEach(([hour, count]) => {
      const h = parseInt(hour);
      if (h >= 6 && h < 12) timeOfDayDist.morning += count;
      else if (h >= 12 && h < 18) timeOfDayDist.afternoon += count;
      else if (h >= 18 && h < 24) timeOfDayDist.evening += count;
    });

    return {
      productiveHour: productiveHour ? `${productiveHour}:00 Uhr` : '-',
      productiveDay: productiveDay ? dayNames[parseInt(productiveDay)] : '-',
      unproductiveDay: unproductiveDay ? dayNames[parseInt(unproductiveDay)] : '-',
      timeOfDayDistribution: timeOfDayDist,
      dayOfWeekDistribution: Object.entries(dayOfWeekTime).map(([day, time]) => ({
        day: dayNames[parseInt(day)],
        time,
        sessions: dayOfWeekCounts[parseInt(day)]
      }))
    };
  }, [timerHistory]);

  /**
   * FÄCHER/RECHTSGEBIETE STATISTIKEN
   */
  const faecherStats = useMemo(() => {
    const allSlots = Object.values(slotsByDate || {}).flat();
    const totalBlocks = allSlots.length;

    // Count blocks by Rechtsgebiet
    const rgCounts = {};
    const rgProgress = {};

    allSlots.forEach(slot => {
      const content = getContent?.(slot.contentId);
      if (content?.rechtsgebiet) {
        rgCounts[content.rechtsgebiet] = (rgCounts[content.rechtsgebiet] || 0) + 1;
      }
    });

    // Calculate progress from contentPlans
    const plans = contentPlans || [];
    plans.forEach(plan => {
      if (plan.rechtsgebiete) {
        plan.rechtsgebiete.forEach(rg => {
          let totalAufgaben = 0;
          let completedAufgaben = 0;

          rg.unterrechtsgebiete?.forEach(urg => {
            urg.kapitel?.forEach(kap => {
              kap.themen?.forEach(thema => {
                thema.aufgaben?.forEach(aufgabe => {
                  totalAufgaben++;
                  if (aufgabe.completed) completedAufgaben++;
                });
              });
            });
          });

          if (totalAufgaben > 0) {
            rgProgress[rg.id] = {
              total: totalAufgaben,
              completed: completedAufgaben,
              percentage: (completedAufgaben / totalAufgaben) * 100
            };
          }
        });
      }
    });

    // Most and least studied
    const sortedRg = Object.entries(rgCounts).sort(([, a], [, b]) => b - a);
    const mostStudied = sortedRg[0]?.[0] || null;
    const leastStudied = sortedRg[sortedRg.length - 1]?.[0] || null;

    // Balance score (how evenly distributed)
    const counts = Object.values(rgCounts);
    const avgCount = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
    const variance = counts.length > 0
      ? counts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / counts.length
      : 0;
    const balanceScore = avgCount > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / avgCount) * 100) : 0;

    return {
      distribution: Object.entries(rgCounts).map(([rg, count]) => ({
        rechtsgebiet: rg,
        count,
        percentage: totalBlocks > 0 ? (count / totalBlocks) * 100 : 0
      })),
      progress: rgProgress,
      mostStudied,
      leastStudied,
      balanceScore,
      totalBlocks
    };
  }, [slotsByDate, contentPlans, getContent]);

  /**
   * AUFGABEN & THEMEN STATISTIKEN
   */
  const aufgabenStats = useMemo(() => {
    // Daily tasks
    const allTasks = Object.values(tasksByDate || {}).flat();
    const completedTasks = allTasks.filter(t => t.completed);

    // Today's tasks
    const todayTasks = tasksByDate?.[todayKey] || [];
    const todayCompleted = todayTasks.filter(t => t.completed);

    // This week's tasks
    const thisWeekTasks = Object.entries(tasksByDate || {})
      .filter(([date]) => date >= weekAgoKey)
      .flatMap(([, tasks]) => tasks);
    const thisWeekCompleted = thisWeekTasks.filter(t => t.completed);

    // Overdue tasks (past dates, not completed)
    const overdueTasks = Object.entries(tasksByDate || {})
      .filter(([date]) => date < todayKey)
      .flatMap(([, tasks]) => tasks.filter(t => !t.completed));

    // Content plan progress
    let totalKapitel = 0;
    let completedKapitel = 0;
    let inProgressKapitel = 0;
    let notStartedKapitel = 0;
    let totalThemen = 0;
    let completedThemen = 0;

    const plans = contentPlans || [];
    plans.forEach(plan => {
      plan.rechtsgebiete?.forEach(rg => {
        rg.unterrechtsgebiete?.forEach(urg => {
          urg.kapitel?.forEach(kap => {
            totalKapitel++;
            let kapTotal = 0;
            let kapCompleted = 0;

            kap.themen?.forEach(thema => {
              totalThemen++;
              let themaCompleted = true;

              thema.aufgaben?.forEach(aufgabe => {
                kapTotal++;
                if (aufgabe.completed) kapCompleted++;
                else themaCompleted = false;
              });

              if (themaCompleted && thema.aufgaben?.length > 0) completedThemen++;
            });

            if (kapCompleted === kapTotal && kapTotal > 0) completedKapitel++;
            else if (kapCompleted > 0) inProgressKapitel++;
            else notStartedKapitel++;
          });
        });
      });
    });

    return {
      // Daily rates
      todayRate: todayTasks.length > 0 ? (todayCompleted.length / todayTasks.length) * 100 : 0,
      weekRate: thisWeekTasks.length > 0 ? (thisWeekCompleted.length / thisWeekTasks.length) * 100 : 0,
      totalRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,

      // Task counts
      todayTotal: todayTasks.length,
      todayCompleted: todayCompleted.length,
      weekTotal: thisWeekTasks.length,
      weekCompleted: thisWeekCompleted.length,
      overdueCount: overdueTasks.length,

      // Kapitel progress
      totalKapitel,
      completedKapitel,
      inProgressKapitel,
      notStartedKapitel,

      // Themen progress
      totalThemen,
      completedThemen,
      themenRate: totalThemen > 0 ? (completedThemen / totalThemen) * 100 : 0
    };
  }, [tasksByDate, contentPlans, todayKey, weekAgoKey]);

  /**
   * LERNPLAN & PLANUNG STATISTIKEN
   */
  const planungStats = useMemo(() => {
    const metadata = lernplanMetadata;

    if (!metadata?.startDate || !metadata?.examDate) {
      return {
        daysSinceStart: 0,
        daysUntilExam: 0,
        timeProgress: 0,
        stoffProgress: 0,
        onTrackScore: 0,
        missedDays: 0,
        planFulfillmentToday: 0,
        planFulfillmentWeek: 0,
        planFulfillmentTotal: 0
      };
    }

    const startDate = new Date(metadata.startDate);
    const examDate = new Date(metadata.examDate);

    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const daysUntilExam = Math.floor((examDate - today) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((examDate - startDate) / (1000 * 60 * 60 * 24));

    const timeProgress = totalDays > 0 ? (daysSinceStart / totalDays) * 100 : 0;

    // Calculate stoff progress from aufgabenStats
    const stoffProgress = aufgabenStats.themenRate;

    // On-track score: compare time progress with stoff progress
    const onTrackScore = timeProgress > 0
      ? Math.min(100, (stoffProgress / timeProgress) * 100)
      : stoffProgress > 0 ? 100 : 0;

    // Count days with learning activity
    const activeDays = new Set(Object.keys(slotsByDate || {})).size;
    const missedDays = Math.max(0, daysSinceStart - activeDays);

    // Plan fulfillment
    const allSlots = Object.values(slotsByDate || {}).flat();
    const lernplanSlots = allSlots.filter(s => s.isFromLernplan);
    const completedSlots = lernplanSlots.filter(s => {
      // A slot is considered completed if all its tasks are done
      return s.tasks?.every(t => t.completed) || false;
    });

    const planFulfillmentTotal = lernplanSlots.length > 0
      ? (completedSlots.length / lernplanSlots.length) * 100
      : 0;

    return {
      daysSinceStart,
      daysUntilExam,
      timeProgress,
      stoffProgress,
      onTrackScore,
      missedDays,
      planFulfillmentTotal,
      activeDays,
      examDate: metadata.examDate
    };
  }, [lernplanMetadata, slotsByDate, aufgabenStats, today]);

  /**
   * KONSISTENZ & GEWOHNHEITEN
   */
  const konsistenzStats = useMemo(() => {
    const allSessions = timerHistory || [];
    const learningDates = [...new Set(allSessions.map(s => s.date))].sort();

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateKey = getDateKey(checkDate);
      if (learningDates.includes(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateKey === todayKey) {
        // Today might not have activity yet
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    learningDates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.floor((date - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = date;
    });

    // Learning days this week
    const thisWeekDays = learningDates.filter(d => d >= weekAgoKey).length;

    // Average learning days per week
    const totalWeeks = Math.max(1, Math.ceil(learningDates.length / 7));
    const avgDaysPerWeek = learningDates.length / totalWeeks;

    return {
      currentStreak,
      longestStreak,
      thisWeekDays,
      avgDaysPerWeek,
      totalLearningDays: learningDates.length
    };
  }, [timerHistory, today, todayKey, weekAgoKey]);

  /**
   * WIEDERHOLUNGEN
   */
  const wiederholungStats = useMemo(() => {
    const allSlots = Object.values(slotsByDate || {}).flat();
    const repetitionSlots = allSlots.filter(s => s.blockType === 'repetition' || s.repeatEnabled);

    // Count by content/topic
    const repByContent = {};
    repetitionSlots.forEach(slot => {
      const contentId = slot.contentId;
      if (contentId) {
        repByContent[contentId] = (repByContent[contentId] || 0) + 1;
      }
    });

    return {
      totalRepetitions: repetitionSlots.length,
      avgRepetitionsPerTopic: Object.keys(repByContent).length > 0
        ? repetitionSlots.length / Object.keys(repByContent).length
        : 0,
      topicsWithRepetitions: Object.keys(repByContent).length
    };
  }, [slotsByDate]);

  /**
   * KLAUSUREN & LEISTUNGEN (from ExamsContext)
   */
  const klausurenStats = useMemo(() => {
    return {
      totalExams: examStats.totalCount,
      avgGrade: examStats.totalAverage,
      bestGrade: examStats.bestGrade,
      worstGrade: examStats.worstGrade,
      gradeTrend: examStats.gradeTrend,
      upcomingCount: examStats.upcomingExams?.length || 0,
      passedCount: examStats.passedExams?.length || 0,
      failedCount: examStats.failedExams?.length || 0,
      bySubject: examStats.subjectStats
    };
  }, [examStats]);

  /**
   * TIMER/POMODORO STATISTIKEN
   */
  const timerStats = useMemo(() => {
    const stats = getTimerStats();

    return {
      todaySessions: stats.today.count,
      todayDuration: stats.today.totalDuration,
      weekSessions: stats.week.count,
      avgSessionsPerDay: stats.week.count / 7,
      completionRate: stats.all.count > 0
        ? (stats.all.completedCount / stats.all.count) * 100
        : 0,
      pomodoroCount: stats.all.pomodoroCount,
      countdownCount: stats.all.countdownCount,
      countupCount: stats.all.countupCount,
      preferredMode: stats.all.pomodoroCount >= stats.all.countdownCount &&
        stats.all.pomodoroCount >= stats.all.countupCount
        ? 'Pomodoro'
        : stats.all.countdownCount >= stats.all.countupCount
          ? 'Countdown'
          : 'Count-up'
    };
  }, [getTimerStats]);

  /**
   * FORMAT HELPERS
   */
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}min`;
  };

  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  /**
   * SCORES - PrepScore & WellScore
   */
  const scores = useMemo(() => {
    // PrepScore = Planerfüllung %
    const prepScore = planungStats.planFulfillmentTotal;

    // WellScore = Based on check-in questionnaire responses if available
    // Falls back to streak-based calculation if no check-in data
    let wellScore;
    let wellTrend;

    if (checkInWellScore !== null) {
      // Use check-in based Well Score
      wellScore = checkInWellScore;
      wellTrend = checkInWellScoreTrend;
    } else {
      // Fallback: Consistency score based on streak and learning days
      // Formula: (currentStreak / 7) * 50 + (avgDaysPerWeek / 7) * 50
      const streakScore = Math.min(50, (konsistenzStats.currentStreak / 7) * 50);
      const daysScore = Math.min(50, (konsistenzStats.avgDaysPerWeek / 7) * 50);
      wellScore = streakScore + daysScore;
      wellTrend = konsistenzStats.currentStreak > 0 ? 5 : -5;
    }

    // Trends (vs last week - simplified)
    const prepTrend = 0; // Would need historical tracking

    return {
      prepScore,
      wellScore,
      prepTrend,
      wellTrend
    };
  }, [planungStats, konsistenzStats, checkInWellScore, checkInWellScoreTrend]);

  /**
   * HEATMAP DATA - Last 30 learning days
   */
  const heatmapData = useMemo(() => {
    const data = [];
    const allSlots = slotsByDate || {};
    const allSessions = timerHistory || [];

    // Create a map of date -> timer duration
    const durationByDate = {};
    allSessions.forEach(session => {
      const dateKey = session.date;
      durationByDate[dateKey] = (durationByDate[dateKey] || 0) + (session.duration || 0);
    });

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);

      // Get planned slots for this day
      const daySlots = allSlots[dateKey] || [];
      const plannedMinutes = daySlots.reduce((sum, slot) => {
        // Estimate 25 minutes per slot block
        return sum + 25;
      }, 0);

      // Get actual learning time
      const achievedSeconds = durationByDate[dateKey] || 0;
      const achievedMinutes = achievedSeconds / 60;

      data.push({
        date: dateKey,
        achieved: achievedMinutes,
        planned: plannedMinutes || achievedMinutes || 0 // Fallback to achieved if no plan
      });
    }

    // Calculate stats
    const activeDays = data.filter(d => d.achieved > 0).length;
    const avgPerformance = data.reduce((sum, d) => {
      if (d.planned > 0) {
        return sum + (d.achieved / d.planned) * 100;
      }
      return sum + (d.achieved > 0 ? 100 : 0);
    }, 0) / 30;

    return {
      data,
      stats: {
        avgPerformance,
        activeDays,
        totalDays: 30
      }
    };
  }, [slotsByDate, timerHistory, today]);

  /**
   * FLAT STATISTICS - For sidebar display
   */
  const flatStats = useMemo(() => {
    return [
      // Lernzeit
      {
        id: 'lernzeit-today',
        label: 'Lernzeit heute',
        value: formatDuration(timerStats.todayDuration),
        category: 'Lernzeit',
        trend: 0,
        chartData: [] // Would need historical data
      },
      {
        id: 'lernzeit-week',
        label: 'Lernzeit diese Woche',
        value: formatDuration(lernzeitStats.thisWeekTime),
        category: 'Lernzeit',
        trend: Math.round(lernzeitStats.weekComparison),
        chartData: []
      },
      {
        id: 'lernzeit-avg',
        label: 'Ø Lernzeit pro Tag',
        value: formatDuration(lernzeitStats.avgPerLearningDay),
        category: 'Lernzeit',
        trend: 0,
        chartData: []
      },
      // Konsistenz
      {
        id: 'streak-current',
        label: 'Aktuelle Streak',
        value: konsistenzStats.currentStreak,
        unit: 'Tage',
        category: 'Konsistenz',
        trend: konsistenzStats.currentStreak > 0 ? 5 : 0,
        chartData: []
      },
      {
        id: 'streak-longest',
        label: 'Längste Streak',
        value: konsistenzStats.longestStreak,
        unit: 'Tage',
        category: 'Konsistenz',
        trend: 0,
        chartData: []
      },
      {
        id: 'days-per-week',
        label: 'Lerntage pro Woche',
        value: konsistenzStats.avgDaysPerWeek.toFixed(1),
        unit: 'Tage',
        category: 'Konsistenz',
        trend: 0,
        chartData: []
      },
      // Aufgaben
      {
        id: 'aufgaben-today',
        label: 'Aufgaben heute',
        value: `${aufgabenStats.todayCompleted}/${aufgabenStats.todayTotal}`,
        category: 'Aufgaben',
        trend: 0,
        chartData: []
      },
      {
        id: 'aufgaben-week',
        label: 'Aufgaben diese Woche',
        value: `${aufgabenStats.weekCompleted}/${aufgabenStats.weekTotal}`,
        category: 'Aufgaben',
        trend: 0,
        chartData: []
      },
      {
        id: 'aufgaben-rate',
        label: 'Erledigungsrate',
        value: Math.round(aufgabenStats.totalRate),
        unit: '%',
        category: 'Aufgaben',
        trend: 0,
        chartData: []
      },
      // Planung
      {
        id: 'ontrack-score',
        label: 'On-Track Score',
        value: Math.round(planungStats.onTrackScore),
        unit: '%',
        category: 'Planung',
        trend: 0,
        chartData: []
      },
      {
        id: 'days-until-exam',
        label: 'Tage bis Examen',
        value: planungStats.daysUntilExam || '-',
        category: 'Planung',
        trend: 0,
        chartData: []
      },
      {
        id: 'stoff-progress',
        label: 'Stoff-Fortschritt',
        value: Math.round(planungStats.stoffProgress),
        unit: '%',
        category: 'Planung',
        trend: 0,
        chartData: []
      },
      // Timer
      {
        id: 'sessions-today',
        label: 'Sessions heute',
        value: timerStats.todaySessions,
        category: 'Timer',
        trend: 0,
        chartData: []
      },
      {
        id: 'sessions-week',
        label: 'Sessions diese Woche',
        value: timerStats.weekSessions,
        category: 'Timer',
        trend: 0,
        chartData: []
      },
      {
        id: 'completion-rate',
        label: 'Abschlussrate',
        value: Math.round(timerStats.completionRate),
        unit: '%',
        category: 'Timer',
        trend: 0,
        chartData: []
      },
      // Klausuren
      {
        id: 'exams-avg',
        label: 'Ø Note',
        value: klausurenStats.avgGrade?.toFixed(2) || '-',
        category: 'Klausuren',
        trend: klausurenStats.gradeTrend === 'improving' ? 5 : klausurenStats.gradeTrend === 'declining' ? -5 : 0,
        chartData: []
      },
      {
        id: 'exams-count',
        label: 'Geschriebene Klausuren',
        value: klausurenStats.totalExams || 0,
        category: 'Klausuren',
        trend: 0,
        chartData: []
      }
    ];
  }, [lernzeitStats, konsistenzStats, aufgabenStats, planungStats, timerStats, klausurenStats, formatDuration]);

  /**
   * CHART TIME SERIES DATA - For line chart display
   * Generates data arrays for each selectable chart statistic
   */
  const chartDataSeries = useMemo(() => {
    const allSessions = timerHistory || [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    // Helper: Generate last N days data
    const generateDailyData = (days, getValue) => {
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = getDateKey(date);
        data.push(getValue(dateKey, date));
      }
      return data;
    };

    // Helper: Generate last N weeks data
    const generateWeeklyData = (weeks, getValue) => {
      const data = [];
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        data.push(getValue(weekStart, weekEnd, i));
      }
      return data;
    };

    // Helper: Generate last N months data
    const generateMonthlyData = (months, getValue) => {
      const data = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(today);
        monthDate.setMonth(monthDate.getMonth() - i);
        data.push(getValue(monthDate, i));
      }
      return data;
    };

    // Duration by date helper
    const durationByDate = {};
    allSessions.forEach(session => {
      durationByDate[session.date] = (durationByDate[session.date] || 0) + (session.duration || 0);
    });

    // Sessions by date helper
    const sessionsByDate = {};
    allSessions.forEach(session => {
      sessionsByDate[session.date] = (sessionsByDate[session.date] || 0) + 1;
    });

    return {
      // Lernzeit pro Lerntag (last 30 days)
      'lernzeit-per-day': {
        name: 'Ø Lernzeit pro Tag',
        color: '#EA580C',
        data: generateDailyData(30, (dateKey) => Math.round((durationByDate[dateKey] || 0) / 60)),
        xLabels: generateDailyData(30, (_, date) => date.getDate().toString()).filter((_, i) => i % 5 === 0 || i === 29),
        yMax: Math.max(300, ...Object.values(durationByDate).map(d => Math.round(d / 60))) + 50,
        unit: 'min'
      },

      // Lernzeit pro Woche (last 12 weeks)
      'lernzeit-per-week': {
        name: 'Ø Lernzeit pro Woche',
        color: '#0D9488',
        data: generateWeeklyData(12, (weekStart, weekEnd) => {
          let total = 0;
          const current = new Date(weekStart);
          while (current <= weekEnd) {
            total += durationByDate[getDateKey(current)] || 0;
            current.setDate(current.getDate() + 1);
          }
          return Math.round(total / 60);
        }),
        xLabels: ['W-12', 'W-10', 'W-8', 'W-6', 'W-4', 'W-2', 'Jetzt'],
        yMax: 1500,
        unit: 'min'
      },

      // Lernzeit pro Monat (last 6 months)
      'lernzeit-per-month': {
        name: 'Ø Lernzeit pro Monat',
        color: '#8B5CF6',
        data: generateMonthlyData(6, (monthDate) => {
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          let total = 0;
          Object.entries(durationByDate).forEach(([date, duration]) => {
            const d = new Date(date);
            if (d.getFullYear() === year && d.getMonth() === month) {
              total += duration;
            }
          });
          return Math.round(total / 60);
        }),
        xLabels: generateMonthlyData(6, (date) => monthNames[date.getMonth()]),
        yMax: 6000,
        unit: 'min'
      },

      // Produktivste Tageszeit (hours distribution)
      'productive-hours': {
        name: 'Aktivität nach Stunde',
        color: '#F59E0B',
        data: Array.from({ length: 24 }, (_, hour) => {
          return allSessions.filter(s => {
            if (s.startTime) {
              const startHour = new Date(s.startTime).getHours();
              return startHour === hour;
            }
            return false;
          }).length;
        }).slice(6, 22), // 6:00 - 22:00
        xLabels: ['6', '8', '10', '12', '14', '16', '18', '20'],
        yMax: 50,
        unit: 'Sessions'
      },

      // Produktivität pro Wochentag
      'weekday-productivity': {
        name: 'Zeit pro Wochentag',
        color: '#EC4899',
        data: dayNames.map((_, dayIndex) => {
          const dayTotal = allSessions
            .filter(s => new Date(s.date).getDay() === dayIndex)
            .reduce((sum, s) => sum + (s.duration || 0), 0);
          return Math.round(dayTotal / 60);
        }),
        xLabels: dayNames,
        yMax: 500,
        unit: 'min'
      },

      // Fächergewichtung (blocks per subject)
      'subject-distribution': {
        name: 'Fächergewichtung',
        color: '#10B981',
        data: (() => {
          const rgData = { 'ÖffR': 0, 'ZivR': 0, 'StrR': 0, 'Quer': 0 };
          const allSlots = Object.values(slotsByDate || {}).flat();
          allSlots.forEach(slot => {
            const content = getContent?.(slot.contentId);
            if (content?.rechtsgebiet) {
              const rg = content.rechtsgebiet;
              if (rg.includes('oeffentlich') || rg.includes('öffentlich')) rgData['ÖffR']++;
              else if (rg.includes('zivil')) rgData['ZivR']++;
              else if (rg.includes('straf')) rgData['StrR']++;
              else rgData['Quer']++;
            }
          });
          return Object.values(rgData);
        })(),
        xLabels: ['ÖffR', 'ZivR', 'StrR', 'Quer'],
        yMax: 100,
        unit: 'Blöcke'
      },

      // Zeit pro Rechtsgebiet/Woche
      'subject-time-weekly': {
        name: 'Zeit pro RG/Woche',
        color: '#6366F1',
        data: (() => {
          const rgData = { 'ÖffR': 0, 'ZivR': 0, 'StrR': 0, 'Quer': 0 };
          // Simplified - would need proper tracking
          return Object.values(rgData);
        })(),
        xLabels: ['ÖffR', 'ZivR', 'StrR', 'Quer'],
        yMax: 300,
        unit: 'min'
      },

      // Aufgaben-Erledigungsrate (Woche) - last 8 weeks
      'task-completion-week': {
        name: 'Erledigungsrate/Woche',
        color: '#14B8A6',
        data: generateWeeklyData(8, (weekStart, weekEnd) => {
          let total = 0;
          let completed = 0;
          const current = new Date(weekStart);
          while (current <= weekEnd) {
            const tasks = tasksByDate?.[getDateKey(current)] || [];
            total += tasks.length;
            completed += tasks.filter(t => t.completed).length;
            current.setDate(current.getDate() + 1);
          }
          return total > 0 ? Math.round((completed / total) * 100) : 0;
        }),
        xLabels: ['W-8', 'W-7', 'W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1'],
        yMax: 100,
        unit: '%'
      },

      // Aufgaben-Erledigungsrate (Monat)
      'task-completion-month': {
        name: 'Erledigungsrate/Monat',
        color: '#F97316',
        data: generateMonthlyData(6, (monthDate) => {
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          let total = 0;
          let completed = 0;
          Object.entries(tasksByDate || {}).forEach(([date, tasks]) => {
            const d = new Date(date);
            if (d.getFullYear() === year && d.getMonth() === month) {
              total += tasks.length;
              completed += tasks.filter(t => t.completed).length;
            }
          });
          return total > 0 ? Math.round((completed / total) * 100) : 0;
        }),
        xLabels: generateMonthlyData(6, (date) => monthNames[date.getMonth()]),
        yMax: 100,
        unit: '%'
      },

      // Ø Aufgaben pro Tag (last 30 days)
      'tasks-per-day': {
        name: 'Aufgaben pro Tag',
        color: '#84CC16',
        data: generateDailyData(30, (dateKey) => {
          const tasks = tasksByDate?.[dateKey] || [];
          return tasks.length;
        }),
        xLabels: generateDailyData(30, (_, date) => date.getDate().toString()).filter((_, i) => i % 5 === 0 || i === 29),
        yMax: 20,
        unit: 'Aufgaben'
      },

      // Streak-Verlauf (last 30 days)
      'streak-history': {
        name: 'Streak-Verlauf',
        color: '#22C55E',
        data: (() => {
          const learningDates = new Set(allSessions.map(s => s.date));
          const streaks = [];
          let currentStreak = 0;

          for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = getDateKey(date);

            if (learningDates.has(dateKey)) {
              currentStreak++;
            } else {
              currentStreak = 0;
            }
            streaks.push(currentStreak);
          }
          return streaks;
        })(),
        xLabels: generateDailyData(30, (_, date) => date.getDate().toString()).filter((_, i) => i % 5 === 0 || i === 29),
        yMax: 30,
        unit: 'Tage'
      },

      // Lerntage pro Woche (last 12 weeks)
      'learning-days-week': {
        name: 'Lerntage pro Woche',
        color: '#A855F7',
        data: generateWeeklyData(12, (weekStart, weekEnd) => {
          const learningDates = new Set(allSessions.map(s => s.date));
          let days = 0;
          const current = new Date(weekStart);
          while (current <= weekEnd) {
            if (learningDates.has(getDateKey(current))) days++;
            current.setDate(current.getDate() + 1);
          }
          return days;
        }),
        xLabels: ['W-12', 'W-10', 'W-8', 'W-6', 'W-4', 'W-2', 'Jetzt'],
        yMax: 7,
        unit: 'Tage'
      },

      // Ausfallquote vs. Fortschritt
      'dropout-rate': {
        name: 'Ausfallquote',
        color: '#EF4444',
        data: generateWeeklyData(8, (weekStart, weekEnd) => {
          const allSlots = Object.entries(slotsByDate || {})
            .filter(([date]) => date >= getDateKey(weekStart) && date <= getDateKey(weekEnd))
            .flatMap(([, slots]) => slots);
          const planned = allSlots.length;
          const completed = allSlots.filter(s => s.completed).length;
          return planned > 0 ? Math.round(((planned - completed) / planned) * 100) : 0;
        }),
        xLabels: ['W-8', 'W-7', 'W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1'],
        yMax: 100,
        unit: '%'
      },

      // Wiederholungs-Blöcke (last 12 weeks)
      'repetition-blocks': {
        name: 'Wiederholungs-Blöcke',
        color: '#0EA5E9',
        data: generateWeeklyData(12, (weekStart, weekEnd) => {
          const allSlots = Object.entries(slotsByDate || {})
            .filter(([date]) => date >= getDateKey(weekStart) && date <= getDateKey(weekEnd))
            .flatMap(([, slots]) => slots);
          return allSlots.filter(s => s.blockType === 'repetition' || s.repeatEnabled).length;
        }),
        xLabels: ['W-12', 'W-10', 'W-8', 'W-6', 'W-4', 'W-2', 'Jetzt'],
        yMax: 20,
        unit: 'Blöcke'
      },

      // Klausurnoten-Verlauf
      'exam-grades': {
        name: 'Klausurnoten',
        color: '#D946EF',
        data: (exams || [])
          .filter(e => e.grade !== null && e.grade !== undefined)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-10)
          .map(e => e.grade),
        xLabels: (exams || [])
          .filter(e => e.grade !== null && e.grade !== undefined)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-10)
          .map((e, i) => `K${i + 1}`),
        yMax: 18,
        unit: 'Punkte'
      },

      // Klausuren pro Rechtsgebiet
      'exams-per-subject': {
        name: 'Klausuren pro RG',
        color: '#F43F5E',
        data: (() => {
          const rgData = { 'ÖffR': 0, 'ZivR': 0, 'StrR': 0 };
          (exams || []).forEach(exam => {
            if (exam.subject?.includes('öffentlich') || exam.subject?.includes('oeffentlich')) rgData['ÖffR']++;
            else if (exam.subject?.includes('zivil') || exam.subject?.includes('Zivil')) rgData['ZivR']++;
            else if (exam.subject?.includes('straf') || exam.subject?.includes('Straf')) rgData['StrR']++;
          });
          return Object.values(rgData);
        })(),
        xLabels: ['ÖffR', 'ZivR', 'StrR'],
        yMax: 20,
        unit: 'Klausuren'
      },

      // Pomodoro-Sessions (last 30 days)
      'pomodoro-sessions': {
        name: 'Sessions pro Tag',
        color: '#06B6D4',
        data: generateDailyData(30, (dateKey) => sessionsByDate[dateKey] || 0),
        xLabels: generateDailyData(30, (_, date) => date.getDate().toString()).filter((_, i) => i % 5 === 0 || i === 29),
        yMax: 20,
        unit: 'Sessions'
      },

      // Session-Abschlussrate (last 8 weeks)
      'session-completion': {
        name: 'Session-Abschlussrate',
        color: '#65A30D',
        data: generateWeeklyData(8, (weekStart, weekEnd) => {
          const weekSessions = allSessions.filter(s => {
            return s.date >= getDateKey(weekStart) && s.date <= getDateKey(weekEnd);
          });
          const total = weekSessions.length;
          const completed = weekSessions.filter(s => s.completed).length;
          return total > 0 ? Math.round((completed / total) * 100) : 0;
        }),
        xLabels: ['W-8', 'W-7', 'W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1'],
        yMax: 100,
        unit: '%'
      }
    };
  }, [timerHistory, tasksByDate, slotsByDate, exams, today, getContent]);

  // Helper to get chart data for selected statistics
  const getChartSeriesForIds = (ids) => {
    return ids
      .map(id => chartDataSeries[id])
      .filter(Boolean);
  };

  /**
   * SIDEBAR STATS - Current values for each chart statistic
   * Used by the sidebar to display current values with trends
   */
  const sidebarStats = useMemo(() => {
    const allSessions = timerHistory || [];
    const totalSeconds = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const learningDays = new Set(allSessions.map(s => s.date)).size;

    return {
      'lernzeit-per-day': {
        value: learningDays > 0 ? formatDuration(totalSeconds / learningDays) : '0min',
        trend: Math.round(lernzeitStats.weekComparison) || 0
      },
      'lernzeit-per-week': {
        value: formatDuration(lernzeitStats.thisWeekTime),
        trend: Math.round(lernzeitStats.weekComparison) || 0
      },
      'lernzeit-per-month': {
        value: formatDuration(lernzeitStats.avgPerMonth),
        trend: 0
      },
      'productive-hours': {
        value: zeitMusterStats.productiveHour,
        trend: 0
      },
      'weekday-productivity': {
        value: zeitMusterStats.productiveDay,
        trend: 0
      },
      'subject-distribution': {
        value: `${faecherStats.totalBlocks} Blöcke`,
        trend: 0
      },
      'subject-time-weekly': {
        value: faecherStats.mostStudied || '-',
        trend: 0
      },
      'task-completion-week': {
        value: `${Math.round(aufgabenStats.weekRate)}%`,
        trend: 0
      },
      'task-completion-month': {
        value: `${Math.round(aufgabenStats.totalRate)}%`,
        trend: 0
      },
      'tasks-per-day': {
        value: aufgabenStats.todayTotal,
        trend: 0
      },
      'streak-history': {
        value: konsistenzStats.currentStreak,
        unit: 'Tage',
        trend: konsistenzStats.currentStreak > 0 ? 5 : 0
      },
      'learning-days-week': {
        value: konsistenzStats.thisWeekDays,
        unit: 'Tage',
        trend: 0
      },
      'dropout-rate': {
        value: `${Math.round(100 - planungStats.planFulfillmentTotal)}%`,
        trend: 0
      },
      'repetition-blocks': {
        value: wiederholungStats.totalRepetitions,
        unit: 'Blöcke',
        trend: 0
      },
      'exam-grades': {
        value: klausurenStats.avgGrade?.toFixed(1) || '-',
        unit: 'Punkte',
        trend: klausurenStats.gradeTrend === 'improving' ? 5 : klausurenStats.gradeTrend === 'declining' ? -5 : 0
      },
      'exams-per-subject': {
        value: klausurenStats.totalExams,
        unit: 'Klausuren',
        trend: 0
      },
      'pomodoro-sessions': {
        value: timerStats.todaySessions,
        unit: 'Sessions',
        trend: 0
      },
      'session-completion': {
        value: `${Math.round(timerStats.completionRate)}%`,
        trend: 0
      }
    };
  }, [
    timerHistory, lernzeitStats, zeitMusterStats, faecherStats,
    aufgabenStats, konsistenzStats, planungStats, wiederholungStats,
    klausurenStats, timerStats, formatDuration
  ]);

  // Helper to get sidebar stats for selected IDs
  const getSidebarStatsForIds = (ids) => {
    return ids.map(id => {
      const chartStat = chartDataSeries[id];
      const sidebarStat = sidebarStats[id];
      if (!chartStat) return null;
      return {
        id,
        label: chartStat.name,
        color: chartStat.color,
        unit: chartStat.unit,
        value: sidebarStat?.value ?? '-',
        trend: sidebarStat?.trend ?? 0
      };
    }).filter(Boolean);
  };

  return {
    // All statistics categories
    lernzeit: lernzeitStats,
    zeitMuster: zeitMusterStats,
    faecher: faecherStats,
    aufgaben: aufgabenStats,
    planung: planungStats,
    konsistenz: konsistenzStats,
    wiederholung: wiederholungStats,
    klausuren: klausurenStats,
    timer: timerStats,

    // New dashboard data
    scores,
    heatmapData,
    flatStats,

    // Chart data
    chartDataSeries,
    getChartSeriesForIds,

    // Sidebar data
    sidebarStats,
    getSidebarStatsForIds,

    // Helpers
    formatDuration,
    formatPercentage
  };
};

export default useStatistics;
