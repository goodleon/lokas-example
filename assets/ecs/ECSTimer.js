const async = require('async');
const logger = require('../logger/Logger');

let ECSTimer = function (updateTime, timescale, isAsync) {
    this._timeScale = timescale || 1.0;
    this.reset();
    this._updateTime = updateTime || 1000;
    this._type = isAsync || this.TYPE.SYNC;
};

ECSTimer.prototype.reset = function () {
    this._interval = null;          //更新间隔
    this._startTime = 0;            //开始时间
    this._timeOffset = 0;           //时间偏移量
    this._runningTime = 0;          //运行时间
    this._onUpdateCb = null;        //更新回调
    this._onLateUpdateCb = null;    //延迟更新回调
    this._lastUpdateTime = 0;       //最后更新时间
    this._prevInterval = 0;           //更新时间间隔
    this._onStartCb = null;           //开启事件回调
    this._onStopCb = null;            //结束事件回调
    this._onPauseCb = null;           //暂停事件回调
    this._onResumeCb = null;          //恢复事件回调
    this._onDestroyCb = null;         //销毁事件回调
    this._state = this.STATE.STOP;  //定时器状态
    this._type = this.TYPE.SYNC;    //定时器类型 SYNC 同步定时器 ASYNC 异步定时器
    this.unscheduleAll();
    this._taskIdGen = 0;            //任务ID生成
    this._tick = 0;
};

ECSTimer.prototype.TYPE = {
    SYNC: 0,
    ASYNC: 1,
    FIXED: 2
};

ECSTimer.prototype.STATE = {
    STOP: 0,
    START: 1,
    ONSTOP: 2
};

ECSTimer.prototype.setOffset = function (offset) {
    this._runningTime -= this._timeOffset;
    this._runningTime += offset;
    this._timeOffset = offset;
};

ECSTimer.prototype.now = function () {
    return Date.now() + this._timeOffset;
};

ECSTimer.prototype.start = function (time) {
    if (this._interval) return;
    this._startTime = time ? time : Date.now();
    this._startTimer();
    this._onStart();
};

ECSTimer.prototype.resetStartTime = function () {
    this._startTime = Date.now();
};

ECSTimer.prototype.getSchedule = function (name) {
    return this._scheduleTasks[name];
};
//{name:name,time:time,task:function}
ECSTimer.prototype.schedule = function (name, task, interval, count, delay, startTime) {
    delay = delay || 0;
    if (this._scheduleTasks[name]) {
        logger.error('task name exists:' + name);
        return;
    }
    this._taskIdGen++;
    this._scheduleTasks[name] = {
        name: name,
        interval: interval,
        startTime: startTime || (this._runningTime + delay),
        lastActiveTime: startTime || (this._runningTime + delay),
        task: task,
        count: count,
        id: this._taskIdGen,
    };
};

ECSTimer.prototype.scheduleOnce = function (name, task, interval, delay, startTime) {
    this.schedule(name, task, interval, 1, delay, startTime);
};

ECSTimer.prototype.getSchedule = function (name) {
    return this._scheduleTasks[name];
};

ECSTimer.prototype.unschedule = function (name) {
    delete this._scheduleTasks[name];
    for (let i = 0; i < this.taskQueue.length; i++) {
        let task = this.taskQueue[i];
        if (task.name === name) {
            this.taskQueue.splice(i, 1);
        }
    }
};

ECSTimer.prototype.unscheduleAll = function () {
    this.taskQueue = [];
    this.removeTasks = [];
    this._scheduleTasks = [];
};

ECSTimer.prototype.activeSchedule = function (interval, now) {
    this.taskQueue = [];
    this.removeTasks = [];
    for (let i in this._scheduleTasks) {
        let task = this._scheduleTasks[i];
        while (task.interval < now - task.lastActiveTime && task.count) {
            this.taskQueue.push({
                name: task.name,
                activeTime: task.lastActiveTime + task.interval,
                interval: task.lastActiveTime + task.interval - now,
                task: task.task,
                id: task.id,
                count: task.count,
            });
            task.count = task.count - 1;
            task.lastActiveTime += task.interval;
            if (!task.count) {
                this.removeTasks.push(task.name);
                break;
            }
        }
    }
    this.taskQueue.sort(function (a, b) {
        if (a.activeTime < b.activeTime) {
            return -1;
        }
        if (a.activeTime > b.activeTime) {
            return 1;
        }
        if (a.activeTime === b.activeTime) {
            if (a.id < b.id) {
                return -1;
            } else {
                return 1;
            }
        }
    });
    for (let i = 0; i < this.taskQueue.length; i++) {
        let taskObj = this.taskQueue[i];
        taskObj.task(taskObj.interval, taskObj.activeTime, taskObj.count);
    }
    this.taskQueue = [];

    for (let i = 0; i < this.removeTasks.length; i++) {

        this.unschedule(this.removeTasks[i]);
    }
    this.removeTasks = [];
};

ECSTimer.prototype.stop = function () {
    this._onStop();
    this._stopTimer();
    this._runningTime = 0;
    this._startTime = 0;
};

ECSTimer.prototype.pause = function () {
    this._onPause();
    this._stopTimer();
};

ECSTimer.prototype.resume = function () {
    if (this._interval) return;
    this._prevInterval = this._updateTime;
    this._startTimer();
    this._onResume();
};

ECSTimer.prototype.destroy = function () {
    this.unscheduleAll();
    this.stop();
    this.reset();
};


ECSTimer.prototype.instantUpdate = function () {
    this._state = this.STATE.START;
    let now = Date.now();
    let interval = now - this._lastUpdateTime;
    interval = interval * this._timeScale;
    this._runningTime += interval;
    this._prevInterval = interval;
    if (this._onUpdateCb) {
        this._onUpdateCb(this._prevInterval, this._runningTime);
    }
    this.activeSchedule(this._prevInterval, this._runningTime);
    if (this._onLateUpdateCb) {
        this._onLateUpdateCb(this._prevInterval, this._runningTime);
    }
    this._lastUpdateTime = now;
};

ECSTimer.prototype._syncUpdate = function () {
    this._lastUpdateTime = Date.now();
    this.instantUpdate();
    if (!this._interval) {
        this._interval = setInterval(function () {
            this._tick++;
            this.instantUpdate();
        }.bind(this), this._updateTime);
    }
};

ECSTimer.prototype._asyncUpdate = function () {
    this._state = this.STATE.START;
    let self = this;
    let now = Date.now();
    let interval = now - this._lastUpdateTime;
    interval /= this._timeScale;
    this._runningTime += interval;
    this._prevInterval = interval;
    async.waterfall([
        function (next) {
            if (self._onUpdateCb) {
                self._onUpdateCb(self._prevInterval, self._runningTime, next);
            } else {
                next(null)
            }
        },
        function (next) {
            if (self._onLateUpdateCb) {
                self._onLateUpdateCb(self._prevInterval, self._runningTime, next);
            } else {
                next(null)
            }
        }
    ], function (err, res) {
        if (err) {
            console.log(err);
        } else if (self._state === self.STATE.ONSTOP) {
            self._state = self.STATE.STOP;
            console.log('timer stopped')
        } else if (self._state === self.STATE.STOP) {
            console.log('timer stopped')
        } else {

            let curtime1 = Date.now();
            let curinterval = curtime1 - self._lastUpdateTime;
            let delta = self.updateTime - curinterval;
            if (delta > 0) {
                setTimeout(function () {
                    self._lastUpdateTime = Date.now();
                    self._asyncUpdate();
                }, delta);
            } else {
                self._lastUpdateTime = Date.now();
                self._asyncUpdate();
            }
        }
    })
};

ECSTimer.prototype._startTimer = function () {
    if (this._type === this.TYPE.SYNC) {
        this._syncUpdate();
    } else if (this._type === this.TYPE.ASYNC) {
        let interval = setInterval(function () {
            if (this._state === this.STATE.STOP) {
                this._asyncUpdate();
                clearInterval(interval);
            }
        }.bind(this), Math.min(100, this._updateTime / 2));
        setTimeout(function () {
            if (interval) {
                clearInterval(interval);
            }
        }, this._updateTime * 2)
    }
};

ECSTimer.prototype._stopTimer = function () {
    clearInterval(this._interval);
    this._interval = null;
};

ECSTimer.prototype._onStart = function () {
    this._onStartCb && this._onStartCb();
};

ECSTimer.prototype._onResume = function () {
    this._onResumeCb && this._onResumeCb();
};

ECSTimer.prototype._onStop = function () {
    this._onStopCb && this._onStopCb();
};

ECSTimer.prototype._onPause = function () {
    this._onPauseCb && this._onPauseCb();
};

ECSTimer.prototype._onDestroy = function () {
    this._onDestroyCb && this._onDestroyCb();
};

Object.defineProperty(ECSTimer.prototype, 'timeScale', {
    set: function (v) {
        this._timeScale = v;
    },
    get: function () {
        return this._timeScale
    }
});

Object.defineProperty(ECSTimer.prototype, 'updateTime', {
    set: function (v) {
        this.updateTime = v;
        this.pause();
        this.resume();
    },
    get: function () {
        return this._updateTime;
    }
});

Object.defineProperty(ECSTimer.prototype, 'lastUpdateTime', {
    get: function () {
        return this._lastUpdateTime + this._timeOffset;
    }
});

Object.defineProperty(ECSTimer.prototype, 'startTime', {
    get: function () {
        return this._startTime + this._timeOffset;
    }
});

Object.defineProperty(ECSTimer.prototype, 'runningTime', {
    get: function () {
        return this._runningTime;
    }
});

Object.defineProperty(ECSTimer.prototype, 'onStart', {
    set: function (cb) {
        this._onStartCb = cb;
    }
});

Object.defineProperty(ECSTimer.prototype, 'onStop', {
    set: function (cb) {
        this._onStopCb = cb;
    }
});

Object.defineProperty(ECSTimer.prototype, 'onPause', {
    set: function (cb) {
        this._onPauseCb = cb;
    }
});

Object.defineProperty(ECSTimer.prototype, 'onResume', {
    set: function (cb) {
        this._onResumeCb = cb;
    }
});

Object.defineProperty(ECSTimer.prototype, 'onDestroy', {
    set: function (cb) {
        this._onDestroyCb = cb;
    }
});

Object.defineProperty(ECSTimer.prototype, 'onUpdate', {
    set: function (cb) {
        this._onUpdateCb = cb;
    }
});


Object.defineProperty(ECSTimer.prototype, 'onLateUpdate', {
    set: function (cb) {
        this._onLateUpdateCb = cb;
    }
});

module.exports = ECSTimer;
