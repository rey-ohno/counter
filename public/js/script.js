$(function() {
  /** リクエストパラメータ */
  const key = getParam('key');
  /** socket.io */
  const socket = io();
  /**
   * 初期化
   */
  $.getJSON('/init.json?key=' + key, function(data) {
    $.each(data, function(index, _obj) {
      clone(_obj.id, _obj.label, _obj.cnt);
    });
  });

  /**
   * カウンター追加ボタン押下時処理
   */
  $(document).on('click', '#add-counter', function() {
    const len = $('.card[id ^=counter-]').length;
    const label = 'ラベル_' + len;
    const data = { 'key': key, 'id': len, 'label': label };
    socket.emit('add', JSON.stringify(data));
  });
  /**
   * label変更ボタン押下字処理
   */
  $(document).on('click', '.rename', function() {
    if ($(this).hasClass('edit')) {
      $(this).removeClass('edit');
      var head = $(this).parents(".card-header");
      var input = head.find(".edit-text");
      var valie = input.val()
        //   head.find(".label").text(valie);
      head.find(".label input").remove();

      const card = $(this).parents('.card');
      const id = card.find('.id').val();
      const data = { "key": key, "id": id, "label": valie };
      socket.emit('rename', JSON.stringify(data));
    } else {
      $(this).addClass('edit');

      const label = $(this).parents('.card-header').find(".label");
      label.html('<input type="text" class="form-control edit-text" value="' + label.text() + '" />');
    }
  });
  /**
   * カンター削除ボタン押下時
   */
  $('#close-modal').on('show.bs.modal', function(event) {
    const button = $(event.relatedTarget);
    const id = button.data('id');
    const modal = $(this);
    modal.find('#delete').data('id', id);
  });

  /**
   * モダールの削除ボタン押下時処理
   */
  $(document).on('click', '#delete', function() {
    const id = $(this).data('id');
    $('#close-modal').modal('hide');
    const data = { 'key': key, 'id': id };
    socket.emit('del', JSON.stringify(data));
  });
  /**
   * リセットボタン押下時処理
   */
  $(document).on('click', '#reset', function() {
    $('#reset-modal').modal('hide');
    const data = { 'key': key };
    socket.emit('reset', JSON.stringify(data));
  });
  /**
   * カウンターUP/DOWNボタン押下時処理
   */
  $(document).on('click', '.add, .subtract', function() {
    const cntObj = $(this).closest('.cnt-group').find('.cnt');
    const cnt = cntObj.val() - 0;
    let type = 'add';
    if (cnt === '' || !$.isNumeric(cnt)) {
      cntObj.val(0);
    } else {
      if ($(this).hasClass('add')) {
        type = 'add';
      } else {
        type = 'subtract';
      }
    }
    cntObj.val(cnt);
    const card = $(this).parents('.card');
    const id = card.find('.id').val();
    const label = card.find('label').text();

    const data = { 'key': key, 'id': id, 'type': type, 'label': label, 'cnt': cntObj.val() - 0 };
    socket.emit('counter', JSON.stringify(data));
    return false;
  });

  /**
   * socket.io受信処理
   */
  socket.on('counter', function(msg) {
    const _json = JSON.parse(msg);
    if (_json.key === key) {
      const card = $('#counter-' + _json.id);
      card.find('label').text(_json.label);
      card.find('.cnt').val(_json.cnt);
    }
  }).on('add', function(msg) {
    const _json = JSON.parse(msg);
    if (_json.key === key) {
      clone(_json.id, _json.label, 0);
    }
  }).on('del', function(msg) {
    const _json = JSON.parse(msg);
    if (_json.key === key) {
      $('#counter-' + _json.id).remove();
    }
  }).on('reset', function(msg) {
    const _json = JSON.parse(msg);
    if (_json.key === key) {
      $.each(_json.list, function(index, _obj) {
        const card = $('#counter-' + _obj.id);
        card.find('.cnt').val(_obj.cnt);
      });
    }
  }).on('rename', function(msg) {
    const _json = JSON.parse(msg);
    if (_json.key === key) {
      const card = $('#counter-' + _json.id);
      card.find('.label').text(_json.label);
    }
  });


  /**
   * card単位でクローン
   *
   * @param _id 一意に特定できるキー
   * @param _label cardタイトル
   * @param _cnt カウント数
   */
  function clone(_id, _label, _cnt) {
    const card = $('.card.tmp').clone(true);
    card.insertBefore('.card.tmp').removeClass('tmp').attr('id', 'counter-' + _id);
    card.find('.close').attr('data-id', _id);
    card.find('.id').val(_id);
    card.find('.cnt').val(_cnt);
    card.find('label').text(_label);
  }
  /**
   * リクエストパラメータの取得
   * @param {*} name パラメータ名
   */
  function getParam(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
});