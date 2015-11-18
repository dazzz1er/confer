<?php

namespace DJB\Confer\Http\ViewComposers;

use Illuminate\Contracts\View\View;
use Auth;

class ConferBarComposer {

    protected $conversations;

    /**
     * Create a new profile composer.
     *
     * @return void
     */
    public function __construct()
    {
        $this->conversations = Auth::user()->getBarConversations();
    }

    /**
     * Bind data to the view.
     *
     * @param  View  $view
     * @return void
     */
    public function compose(View $view)
    {
        $view->with('bar_conversations', $this->conversations);
    }

}
