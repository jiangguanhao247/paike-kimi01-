// 数据层 - API + localStorage 双保险
const STORAGE_KEY = 'schedule_system_v1';
const API_BASE = window.location.origin;

const DataStore = {
  data: null,
  pendingSave: null,
  serverAvailable: true,

  init() {
    // 第一步：先同步加载本地数据，确保页面立即可渲染，不会报 null
    this.loadFromLocal();

    // 第二步：异步尝试从服务器拉取最新数据并合并
    this.loadFromServer();
  },

  defaultData() {
    return {
      teachers: [
        { id: 't1', name: '张老师', phone: '13800138001' },
        { id: 't2', name: '李老师', phone: '13800138002' },
        { id: 't3', name: '王老师', phone: '13800138003' },
        { id: 't4', name: '赵老师', phone: '13800138004' },
        { id: 't5', name: '刘老师', phone: '13800138005' },
      ],
      courses: [
        { id: 'c1', name: '语文', type: 'normal', grades: ['高一', '高二', '高三'] },
        { id: 'c2', name: '数学', type: 'normal', grades: ['高一', '高二', '高三'] },
        { id: 'c3', name: '英语', type: 'normal', grades: ['高一', '高二', '高三'] },
        { id: 'c4', name: '物理', type: 'lab', grades: ['高一', '高二', '高三'] },
        { id: 'c5', name: '化学', type: 'lab', grades: ['高一', '高二', '高三'] },
        { id: 'c6', name: '生物', type: 'lab', grades: ['高一', '高二'] },
        { id: 'c7', name: '历史', type: 'normal', grades: ['高一', '高二', '高三'] },
        { id: 'c8', name: '地理', type: 'normal', grades: ['高一', '高二'] },
        { id: 'c9', name: '政治', type: 'normal', grades: ['高一', '高二', '高三'] },
        { id: 'c10', name: '体育', type: 'normal', grades: ['高一', '高二', '高三'] },
      ],
      classes: [
        { id: 'cl1', name: '高一(1)班', grade: '高一', size: 45 },
        { id: 'cl2', name: '高一(2)班', grade: '高一', size: 42 },
        { id: 'cl3', name: '高一(3)班', grade: '高一', size: 48 },
        { id: 'cl4', name: '高一(4)班', grade: '高一', size: 46 },
      ],
      rooms: [
        { id: 'r1', name: 'A101', capacity: 50, type: 'normal' },
        { id: 'r2', name: 'A102', capacity: 50, type: 'normal' },
        { id: 'r3', name: 'A103', capacity: 50, type: 'normal' },
        { id: 'r4', name: 'B201', capacity: 60, type: 'lab' },
        { id: 'r5', name: 'B202', capacity: 60, type: 'lab' },
      ],
      courseHours: {},
      teacherAssign: {},
      weekRules: [],
      timetable: {},
    };
  },

  // 从本地加载（同步，确保页面立即可用）
  loadFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          this.data = this.validateData(parsed);
          console.log('本地数据加载成功');
          return;
        }
      }
    } catch (e) {
      console.error('本地加载失败', e);
    }
    // 本地没有或损坏，使用默认数据
    this.data = this.defaultData();
    this.saveToLocal();
    console.log('使用默认数据并保存到本地');
  },

  // 从服务器加载（异步，更新到最新）
  loadFromServer() {
    fetch(`${API_BASE}/api/data`)
      .then(res => {
        if (!res.ok) throw new Error('服务器响应错误: ' + res.status);
        return res.json();
      })
      .then(serverData => {
        if (serverData && Object.keys(serverData).length > 0) {
          // 服务器有数据，合并（服务器优先）
          this.data = this.validateData(serverData);
          this.saveToLocal();
          console.log('服务器数据加载成功，已更新本地缓存');
          // 触发页面刷新（如果数据有变化）
          if (typeof render === 'function') render();
          if (typeof renderTable === 'function') renderTable();
          if (typeof renderClassSelect === 'function') renderClassSelect();
        } else {
          // 服务器无数据，把本地数据推上去
          this.saveToServer();
          console.log('服务器无数据，已推送本地数据');
        }
        this.serverAvailable = true;
      })
      .catch(err => {
        console.warn('服务器不可用，继续使用本地数据:', err.message);
        this.serverAvailable = false;
      });
  },

  // 数据校验
  validateData(data) {
    const defaults = this.defaultData();
    return {
      teachers: Array.isArray(data.teachers) ? data.teachers : defaults.teachers,
      courses: Array.isArray(data.courses) ? data.courses : defaults.courses,
      classes: Array.isArray(data.classes) ? data.classes : defaults.classes,
      rooms: Array.isArray(data.rooms) ? data.rooms : defaults.rooms,
      courseHours: data.courseHours || {},
      teacherAssign: data.teacherAssign || {},
      weekRules: Array.isArray(data.weekRules) ? data.weekRules : [],
      timetable: data.timetable || {},
    };
  },

  // 保存到本地（同步）
  saveToLocal() {
    if (this.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  },

  // 保存到服务器（异步）
  saveToServer() {
    if (!this.serverAvailable || !this.data) return;
    fetch(`${API_BASE}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.data),
    })
      .then(res => {
        if (!res.ok) throw new Error('保存失败');
        return res.json();
      })
      .then(result => {
        console.log('服务器保存成功:', result.message);
      })
      .catch(err => {
        console.warn('服务器保存失败，数据已保留在本地:', err.message);
        this.serverAvailable = false;
      });
  },

  // 统一保存入口（本地立即存，服务器防抖存）
  save() {
    if (!this.data) return;
    this.saveToLocal();
    if (this.pendingSave) clearTimeout(this.pendingSave);
    this.pendingSave = setTimeout(() => {
      this.saveToServer();
    }, 300);
  },

  // 教师
  getTeachers() { return this.data ? this.data.teachers : []; },
  addTeacher(t) {
    if (!this.data) this.loadFromLocal();
    this.data.teachers.push(t);
    this.save();
  },
  updateTeacher(id, updates) {
    if (!this.data) this.loadFromLocal();
    const t = this.data.teachers.find(x => x.id === id);
    if (t) Object.assign(t, updates);
    this.save();
  },
  deleteTeacher(id) {
    if (!this.data) this.loadFromLocal();
    this.data.teachers = this.data.teachers.filter(x => x.id !== id);
    this.save();
  },
  deleteTeachers(ids) {
    if (!this.data) this.loadFromLocal();
    this.data.teachers = this.data.teachers.filter(x => !ids.includes(x.id));
    this.save();
  },

  // 课程
  getCourses() { return this.data ? this.data.courses : []; },
  addCourse(c) {
    if (!this.data) this.loadFromLocal();
    this.data.courses.push(c);
    this.save();
  },
  updateCourse(id, updates) {
    if (!this.data) this.loadFromLocal();
    const c = this.data.courses.find(x => x.id === id);
    if (c) Object.assign(c, updates);
    this.save();
  },
  deleteCourse(id) {
    if (!this.data) this.loadFromLocal();
    this.data.courses = this.data.courses.filter(x => x.id !== id);
    this.save();
  },
  deleteCourses(ids) {
    if (!this.data) this.loadFromLocal();
    this.data.courses = this.data.courses.filter(x => !ids.includes(x.id));
    this.save();
  },

  // 班级
  getClasses() { return this.data ? this.data.classes : []; },
  addClass(c) {
    if (!this.data) this.loadFromLocal();
    this.data.classes.push(c);
    this.save();
  },
  updateClass(id, updates) {
    if (!this.data) this.loadFromLocal();
    const c = this.data.classes.find(x => x.id === id);
    if (c) Object.assign(c, updates);
    this.save();
  },
  deleteClass(id) {
    if (!this.data) this.loadFromLocal();
    this.data.classes = this.data.classes.filter(x => x.id !== id);
    this.save();
  },
  deleteClasses(ids) {
    if (!this.data) this.loadFromLocal();
    this.data.classes = this.data.classes.filter(x => !ids.includes(x.id));
    this.save();
  },

  // 单双周规则
  getWeekRules() { return this.data ? this.data.weekRules : []; },
  addWeekRule(r) {
    if (!this.data) this.loadFromLocal();
    this.data.weekRules.push(r);
    this.save();
  },
  updateWeekRule(id, updates) {
    if (!this.data) this.loadFromLocal();
    const item = this.data.weekRules.find(x => x.id === id);
    if (item) Object.assign(item, updates);
    this.save();
  },
  deleteWeekRule(id) {
    if (!this.data) this.loadFromLocal();
    this.data.weekRules = this.data.weekRules.filter(x => x.id !== id);
    this.save();
  },
  deleteWeekRules(ids) {
    if (!this.data) this.loadFromLocal();
    this.data.weekRules = this.data.weekRules.filter(x => !ids.includes(x.id));
    this.save();
  },

  // 教室
  getRooms() { return this.data ? this.data.rooms : []; },

  // 课程安排
  getCourseHours(classId, courseId) {
    if (!this.data) this.loadFromLocal();
    return this.data.courseHours[classId]?.[courseId] || 0;
  },
  setCourseHours(classId, courseId, hours) {
    if (!this.data) this.loadFromLocal();
    if (!this.data.courseHours[classId]) this.data.courseHours[classId] = {};
    this.data.courseHours[classId][courseId] = hours;
    this.save();
  },
  clearCourseHours(classId) {
    if (!this.data) this.loadFromLocal();
    delete this.data.courseHours[classId];
    this.save();
  },

  // 教师安排
  getTeacherAssign(classId, courseId) {
    if (!this.data) this.loadFromLocal();
    return this.data.teacherAssign[classId]?.[courseId] || '';
  },
  setTeacherAssign(classId, courseId, teacherId) {
    if (!this.data) this.loadFromLocal();
    if (!this.data.teacherAssign[classId]) this.data.teacherAssign[classId] = {};
    this.data.teacherAssign[classId][courseId] = teacherId;
    this.save();
  },
  clearTeacherAssign(classId) {
    if (!this.data) this.loadFromLocal();
    delete this.data.teacherAssign[classId];
    this.save();
  },

  // 排课
  getTimetable() { return this.data ? this.data.timetable : {}; },
  setTimetable(t) {
    if (!this.data) this.loadFromLocal();
    this.data.timetable = t;
    this.save();
  },

  // 导出导入
  export() {
    if (!this.data) this.loadFromLocal();
    return JSON.stringify(this.data, null, 2);
  },
  import(json) {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('导入的数据格式不正确');
    }
    this.data = this.validateData(parsed);
    this.saveToLocal();
    this.saveToServer();
  },

  genId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }
};

DataStore.init();