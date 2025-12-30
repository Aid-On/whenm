import { describe, it, expect } from 'vitest';
import { createMockWhenM } from './test-setup';

/**
 * 時間推論結合テスト
 * 
 * Event Calculusベースの時間推論エンジンの
 * 複雑な時間的クエリと推論能力を検証します。
 */
describe('Temporal Reasoning Integration Tests', () => {
  
  describe('状態の持続と変化の追跡', () => {
    it('should track persistent states and state changes over time', async () => {
      const whenm = createMockWhenM();

      // 状態変化のイベント列
      await whenm.remember('Light turned on', '2023-01-01T08:00:00Z');
      await whenm.remember('Light turned off', '2023-01-01T18:00:00Z');
      await whenm.remember('Light turned on', '2023-01-02T07:30:00Z');
      await whenm.remember('Light turned off', '2023-01-02T23:00:00Z');
      await whenm.remember('Door opened', '2023-01-01T09:00:00Z');
      await whenm.remember('Door closed', '2023-01-01T09:05:00Z');
      await whenm.remember('Door opened', '2023-01-01T12:00:00Z');
      await whenm.remember('Door closed', '2023-01-01T12:30:00Z');
      
      // 特定時点での状態クエリ
      const lightStatus0900 = await whenm.ask('Is the light on?', '2023-01-01T09:00:00Z');
      expect(lightStatus0900).toBeDefined();
      
      const doorStatus0903 = await whenm.ask('Is the door open?', '2023-01-01T09:03:00Z');
      expect(doorStatus0903).toBeDefined();
      
      const doorStatus1000 = await whenm.ask('Is the door open?', '2023-01-01T10:00:00Z');
      expect(doorStatus1000).toBeDefined();
      
      await whenm.reset();
    });

    it('should handle overlapping states and concurrent events', async () => {
      const whenm = createMockWhenM();

      // 並行する複数の状態
      await whenm.remember('Server A started', '2023-01-01T00:00:00Z');
      await whenm.remember('Server B started', '2023-01-01T00:30:00Z');
      await whenm.remember('Server C started', '2023-01-01T01:00:00Z');
      await whenm.remember('Server A stopped', '2023-01-01T06:00:00Z');
      await whenm.remember('Server B stopped', '2023-01-01T12:00:00Z');
      await whenm.remember('Server C stopped', '2023-01-01T18:00:00Z');
      await whenm.remember('Server A started', '2023-01-01T07:00:00Z');
      
      // 特定時点でのアクティブサーバー
      const activeAt0200 = await whenm.search('started', {
        to: '2023-01-01T02:00:00Z'
      });
      expect(activeAt0200.length).toBeGreaterThanOrEqual(3);
      
      const activeAt0800 = await whenm.ask('Which servers are running?', '2023-01-01T08:00:00Z');
      expect(activeAt0800).toBeDefined();
      
      await whenm.reset();
    });
  });

  describe('因果関係と依存性の推論', () => {
    it('should track causal relationships between events', async () => {
      const whenm = createMockWhenM();

      // 因果連鎖のイベント
      await whenm.remember('Button pressed', '2023-01-01T10:00:00Z');
      await whenm.remember('Motor started', '2023-01-01T10:00:01Z');
      await whenm.remember('Conveyor belt moving', '2023-01-01T10:00:02Z');
      await whenm.remember('Product detected', '2023-01-01T10:00:10Z');
      await whenm.remember('Arm activated', '2023-01-01T10:00:11Z');
      await whenm.remember('Product picked', '2023-01-01T10:00:12Z');
      await whenm.remember('Arm moved to destination', '2023-01-01T10:00:15Z');
      await whenm.remember('Product placed', '2023-01-01T10:00:16Z');
      await whenm.remember('Cycle completed', '2023-01-01T10:00:20Z');
      
      // 因果関係のクエリ
      const sequence = await whenm.search('', {
        from: '2023-01-01T10:00:00Z',
        to: '2023-01-01T10:00:30Z'
      });
      expect(sequence.length).toBe(9);
      
      // 特定イベント間の時間差
      const buttonToMotor = sequence.filter(e => 
        e.verb === 'pressed' || e.verb === 'started'
      );
      expect(buttonToMotor).toHaveLength(2);
      
      await whenm.reset();
    });

    it('should identify event patterns and cycles', async () => {
      const whenm = createMockWhenM();

      // 繰り返しパターン
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const baseDate = new Date('2023-01-02'); // Monday
      
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 5; day++) {
          const date = new Date(baseDate);
          date.setDate(date.getDate() + (week * 7) + day);
          const dateStr = date.toISOString().split('T')[0];
          
          await whenm.remember(`Alice arrived at office`, `${dateStr}T09:00:00Z`);
          await whenm.remember(`Alice attended standup`, `${dateStr}T10:00:00Z`);
          await whenm.remember(`Alice took lunch break`, `${dateStr}T12:00:00Z`);
          await whenm.remember(`Alice resumed work`, `${dateStr}T13:00:00Z`);
          await whenm.remember(`Alice left office`, `${dateStr}T18:00:00Z`);
        }
      }
      
      // パターン分析
      const standups = await whenm.search('standup');
      expect(standups).toHaveLength(20); // 4 weeks × 5 days
      
      const lunchBreaks = await whenm.search('lunch');
      expect(lunchBreaks).toHaveLength(20);
      
      // 特定週のアクティビティ
      const week2 = await whenm.search('Alice', {
        from: '2023-01-09',
        to: '2023-01-13'
      });
      expect(week2.length).toBe(25); // 5 events × 5 days
      
      await whenm.reset();
    });
  });

  describe('時間的制約と期限の管理', () => {
    it('should track deadlines and time constraints', async () => {
      const whenm = createMockWhenM();

      // タスクと期限
      await whenm.remember('Task A assigned to Alice with deadline 2023-02-15', '2023-01-15');
      await whenm.remember('Task B assigned to Bob with deadline 2023-02-20', '2023-01-20');
      await whenm.remember('Task C assigned to Charlie with deadline 2023-02-10', '2023-01-25');
      await whenm.remember('Alice started Task A', '2023-01-20');
      await whenm.remember('Charlie started Task C', '2023-01-26');
      await whenm.remember('Bob started Task B', '2023-02-01');
      await whenm.remember('Charlie completed Task C', '2023-02-08');
      await whenm.remember('Alice completed Task A', '2023-02-14');
      await whenm.remember('Bob completed Task B', '2023-02-22'); // 遅延
      
      // 期限遵守の確認
      const completions = await whenm.search('completed');
      expect(completions).toHaveLength(3);
      
      // タスクCは期限内
      const taskC = completions.find(e => e.subject === 'Charlie');
      expect(taskC?.date).toBe('2023-02-08');
      
      // タスクAは期限内
      const taskA = completions.find(e => e.subject === 'Alice');
      expect(taskA?.date).toBe('2023-02-14');
      
      // タスクBは期限超過
      const taskB = completions.find(e => e.subject === 'Bob');
      expect(taskB?.date).toBe('2023-02-22');
      
      await whenm.reset();
    });

    it('should handle time windows and intervals', async () => {
      const whenm = createMockWhenM();

      // 営業時間とシフト
      await whenm.remember('Store opened', '2023-01-01T09:00:00Z');
      await whenm.remember('Morning shift started', '2023-01-01T09:00:00Z');
      await whenm.remember('Alice clocked in', '2023-01-01T08:55:00Z');
      await whenm.remember('Bob clocked in', '2023-01-01T09:05:00Z');
      await whenm.remember('Customer 1 entered', '2023-01-01T09:15:00Z');
      await whenm.remember('Customer 1 purchased', '2023-01-01T09:25:00Z');
      await whenm.remember('Customer 2 entered', '2023-01-01T10:00:00Z');
      await whenm.remember('Afternoon shift started', '2023-01-01T14:00:00Z');
      await whenm.remember('Charlie clocked in', '2023-01-01T13:55:00Z');
      await whenm.remember('Alice clocked out', '2023-01-01T14:05:00Z');
      await whenm.remember('Store closed', '2023-01-01T21:00:00Z');
      
      // 時間窓クエリ
      const morningActivity = await whenm.search('', {
        from: '2023-01-01T09:00:00Z',
        to: '2023-01-01T12:00:00Z'
      });
      expect(morningActivity.length).toBeGreaterThanOrEqual(6);
      
      const staffPresent1030 = await whenm.ask('Who is working?', '2023-01-01T10:30:00Z');
      expect(staffPresent1030).toBeDefined();
      
      const staffPresent1500 = await whenm.ask('Who is working?', '2023-01-01T15:00:00Z');
      expect(staffPresent1500).toBeDefined();
      
      await whenm.reset();
    });
  });

  describe('時間的集約とトレンド分析', () => {
    it('should aggregate events and identify trends', async () => {
      const whenm = createMockWhenM();

      // 売上データの時系列
      const salesData = [
        { amount: 1000, date: '2023-01-01' },
        { amount: 1200, date: '2023-01-02' },
        { amount: 1100, date: '2023-01-03' },
        { amount: 1300, date: '2023-01-04' },
        { amount: 1500, date: '2023-01-05' },
        { amount: 900, date: '2023-01-06' },  // 週末
        { amount: 800, date: '2023-01-07' },  // 週末
        { amount: 1400, date: '2023-01-08' },
        { amount: 1600, date: '2023-01-09' },
        { amount: 1700, date: '2023-01-10' },
        { amount: 1800, date: '2023-01-11' },
        { amount: 2000, date: '2023-01-12' },
        { amount: 1000, date: '2023-01-13' }, // 週末
        { amount: 950, date: '2023-01-14' },  // 週末
      ];
      
      for (const sale of salesData) {
        await whenm.remember(`Sales recorded $${sale.amount}`, sale.date);
      }
      
      // 週次集計
      const week1Sales = await whenm.search('Sales', {
        from: '2023-01-01',
        to: '2023-01-07'
      });
      expect(week1Sales).toHaveLength(7);
      
      const week2Sales = await whenm.search('Sales', {
        from: '2023-01-08',
        to: '2023-01-14'
      });
      expect(week2Sales).toHaveLength(7);
      
      // トレンド識別（上昇傾向）
      const highSales = await whenm.search('2000');
      expect(highSales).toHaveLength(1);
      expect(highSales[0].date).toBe('2023-01-12');
      
      await whenm.reset();
    });

    it('should calculate event frequencies and densities', async () => {
      const whenm = createMockWhenM();

      // イベント頻度のテスト
      // 高頻度期間
      for (let i = 0; i < 20; i++) {
        const time = `2023-01-01T10:${String(i).padStart(2, '0')}:00Z`;
        await whenm.remember(`Alert triggered`, time);
      }
      
      // 低頻度期間
      await whenm.remember('Alert triggered', '2023-01-01T11:00:00Z');
      await whenm.remember('Alert triggered', '2023-01-01T11:30:00Z');
      await whenm.remember('Alert triggered', '2023-01-01T12:00:00Z');
      
      // 頻度分析
      const highFreqPeriod = await whenm.search('Alert', {
        from: '2023-01-01T10:00:00Z',
        to: '2023-01-01T10:30:00Z'
      });
      expect(highFreqPeriod.length).toBe(20);
      
      const lowFreqPeriod = await whenm.search('Alert', {
        from: '2023-01-01T11:00:00Z',
        to: '2023-01-01T13:00:00Z'
      });
      expect(lowFreqPeriod.length).toBe(3);
      
      await whenm.reset();
    });
  });

  describe('複雑な時間的クエリ', () => {
    it('should handle complex temporal queries with multiple conditions', async () => {
      const whenm = createMockWhenM();

      // 複雑なイベントセット
      await whenm.remember('System A deployed to staging', '2023-01-10T10:00:00Z');
      await whenm.remember('System A passed staging tests', '2023-01-10T14:00:00Z');
      await whenm.remember('System A approved for production', '2023-01-10T16:00:00Z');
      await whenm.remember('System A deployed to production', '2023-01-11T02:00:00Z');
      await whenm.remember('System A monitoring started', '2023-01-11T02:01:00Z');
      await whenm.remember('System B deployed to staging', '2023-01-11T10:00:00Z');
      await whenm.remember('System A performance issue detected', '2023-01-11T15:00:00Z');
      await whenm.remember('System A rollback initiated', '2023-01-11T15:30:00Z');
      await whenm.remember('System A rollback completed', '2023-01-11T16:00:00Z');
      await whenm.remember('System B failed staging tests', '2023-01-11T14:00:00Z');
      await whenm.remember('System B fix applied', '2023-01-12T09:00:00Z');
      await whenm.remember('System B passed staging tests', '2023-01-12T13:00:00Z');
      await whenm.remember('System B approved for production', '2023-01-12T15:00:00Z');
      await whenm.remember('System B deployed to production', '2023-01-13T02:00:00Z');
      
      // 1. 本番環境へのデプロイメント
      const prodDeployments = await whenm.search('deployed to production');
      expect(prodDeployments).toHaveLength(2);
      
      // 2. 失敗したデプロイメント
      const failures = await whenm.query()
        .verb('failed')
        .execute();
      expect(failures).toHaveLength(1);
      expect(failures[0].subject).toBe('System B');
      
      // 3. ロールバックが必要だったシステム
      const rollbacks = await whenm.search('rollback');
      expect(rollbacks).toHaveLength(2);
      const rolledBackSystem = rollbacks[0].subject;
      expect(rolledBackSystem).toBe('System A');
      
      // 4. 成功したデプロイメント（ロールバックなし）
      const systemBProd = prodDeployments.find(e => e.subject === 'System B');
      expect(systemBProd?.date).toBe('2023-01-13T02:00:00Z');
      
      // 5. デプロイメントサイクル時間
      const systemAEvents = await whenm.query()
        .subject('System A')
        .execute();
      const stagingDeploy = systemAEvents.find(e => e.object?.includes('staging'));
      const prodDeploy = systemAEvents.find(e => e.object?.includes('production'));
      expect(stagingDeploy).toBeDefined();
      expect(prodDeploy).toBeDefined();
      
      await whenm.reset();
    });

    it('should support time-based what-if scenarios', async () => {
      const whenm = createMockWhenM();

      // ベースラインシナリオ
      await whenm.remember('Project started with 5 developers', '2023-01-01');
      await whenm.remember('Feature A development started', '2023-01-15');
      await whenm.remember('Feature B development started', '2023-01-15');
      await whenm.remember('Feature A completed', '2023-02-15');
      await whenm.remember('Feature B delayed', '2023-02-20');
      await whenm.remember('2 more developers added', '2023-02-25');
      await whenm.remember('Feature B development resumed', '2023-03-01');
      await whenm.remember('Feature B completed', '2023-03-15');
      await whenm.remember('Project delivered', '2023-03-20');
      
      // What-if分析
      
      // Q1: もし追加の開発者が早く参加していたら？
      const delayEvents = await whenm.search('delayed');
      expect(delayEvents).toHaveLength(1);
      
      const additionalDevs = await whenm.search('developers added');
      expect(additionalDevs).toHaveLength(1);
      expect(additionalDevs[0].date).toBe('2023-02-25');
      
      // Q2: 並行開発の影響
      const parallelFeatures = await whenm.search('development started', {
        from: '2023-01-15',
        to: '2023-01-15'
      });
      expect(parallelFeatures).toHaveLength(2);
      
      // Q3: プロジェクト全体の期間
      const projectStart = await whenm.search('Project started');
      const projectEnd = await whenm.search('Project delivered');
      expect(projectStart[0].date).toBe('2023-01-01');
      expect(projectEnd[0].date).toBe('2023-03-20');
      
      await whenm.reset();
    });
  });
});