@if (Auth::check())
<script src="/vendor/confer/js/confer.js"></script>
<script>
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

(function ($, undefined) {
    $.fn.getCursorPosition = function() {
        var el = $(this).get(0);
        var pos = 0;
        if('selectionStart' in el) {
            pos = el.selectionStart;
        } else if('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }
})(jQuery);

(function() {
	var options = {
		pusher_key : "{{ config('services.pusher.public') }}",
		base_url : "{{ url('/') }}",
		avatar_dir : "{{ url('/') . config('confer.avatar_dir') }}",
		token : "{{ csrf_token() }}",
		loader : "{{ config('confer.loader') }}",
        requested_conversations : {{ Session::has('confer_requested_conversations') ? json_encode(Session::get('confer_requested_conversations')) : '[]' }},
        use_emoji : "{{ config('confer.enable_emoji') }}",
		grammar_enforcer : "{{ config('confer.grammar_enforcer') }}"
	};
	var confer = new window.Confer($('div.confer-overlay'), $('ul.confer-open-conversations-list'), {{ Auth::user()->id }}, options);
})();
</script>
@endif